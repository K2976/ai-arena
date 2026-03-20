import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, RotateCcw, Save } from 'lucide-react'
import { saveWorkoutSession } from '../services/api'
import './FeaturePages.css'

const POSE_CONNECTIONS = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
  [27, 31],
  [28, 32],
]

export default function RepCounter() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const poseLandmarkerRef = useRef(null)
  const animationRef = useRef(null)
  const lastVideoTimeRef = useRef(-1)
  const stageRef = useRef('Stand')
  const isStreamingRef = useRef(false)
  const sessionStartRef = useRef(0)
  const lastRepAtRef = useRef(0)

  const [devices, setDevices] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isPoseLoading, setIsPoseLoading] = useState(false)
  const [isPoseReady, setIsPoseReady] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [reps, setReps] = useState(0)
  const [targetReps, setTargetReps] = useState(20)
  const [exerciseMode, setExerciseMode] = useState('squat')
  const [movementStage, setMovementStage] = useState('Stand')
  const [lastAngle, setLastAngle] = useState(180)
  const [symmetryScore, setSymmetryScore] = useState(100)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [postureAdvice, setPostureAdvice] = useState('')
  const [adviceColor, setAdviceColor] = useState('text-blue-400')
  const [repGlowActive, setRepGlowActive] = useState(false)
  const angleHistoryRef = useRef([])

  const cameraSupported = useMemo(() => Boolean(navigator.mediaDevices?.getUserMedia), [])

  const calculateAngle = (pointA, pointB, pointC) => {
    const radians =
      Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) -
      Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x)
    let degrees = Math.abs((radians * 180) / Math.PI)
    if (degrees > 180) degrees = 360 - degrees
    return degrees
  }

  const getSmoothedAngle = useCallback((newAngle) => {
    angleHistoryRef.current.push(newAngle)
    if (angleHistoryRef.current.length > 5) angleHistoryRef.current.shift()
    return angleHistoryRef.current.reduce((a, b) => a + b, 0) / angleHistoryRef.current.length
  }, [])

  const updatePostureAdvice = useCallback((text, color = 'text-slate-300') => {
    setPostureAdvice(text)
    setAdviceColor(color)
  }, [])

  const drawPoseOverlay = useCallback((result, formIssues = null, currentAngle = 0) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const width = video.videoWidth || video.clientWidth
    const height = video.videoHeight || video.clientHeight
    if (!width || !height) return

    if (canvas.width !== width) canvas.width = width
    if (canvas.height !== height) canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) return

    context.clearRect(0, 0, width, height)

    const landmarks = result?.landmarks?.[0]
    if (!landmarks) return

    context.lineWidth = 3
    context.strokeStyle = '#22d3ee'

    POSE_CONNECTIONS.forEach(([startIndex, endIndex]) => {
      const start = landmarks[startIndex]
      const end = landmarks[endIndex]
      if (!start || !end) return
      if ((start.visibility ?? 1) < 0.4 || (end.visibility ?? 1) < 0.4) return

      context.beginPath()
      context.moveTo(start.x * width, start.y * height)
      context.lineTo(end.x * width, end.y * height)
      context.stroke()
    })

    context.fillStyle = '#2563eb'
    landmarks.forEach((point) => {
      if (!point || (point.visibility ?? 1) < 0.45) return
      context.beginPath()
      context.arc(point.x * width, point.y * height, 4, 0, Math.PI * 2)
      context.fill()
    })

    // Draw angle label on active joint
    if (currentAngle > 0) {
      let jointIndex = 25 // Default to left knee for squats
      if (exerciseMode === 'bicep_curl' || exerciseMode === 'shoulder_press') {
        jointIndex = 13 // Left elbow
      } else if (exerciseMode === 'pushup') {
        jointIndex = 13 // Left elbow
      }

      const joint = landmarks[jointIndex]
      if (joint && (joint.visibility ?? 1) > 0.4) {
        const x = joint.x * width
        const y = joint.y * height

        // Draw background pill
        context.fillStyle = 'rgba(15, 23, 42, 0.8)'
        context.beginPath()
        context.roundRect(x + 15, y - 35, 60, 30, 8)
        context.fill()

        // Draw angle text
        context.font = 'bold 16px Inter, sans-serif'
        context.fillStyle = '#4ade80'
        context.fillText(Math.round(currentAngle) + '°', x + 25, y - 15)
      }
    }

    // Highlight joints with form issues
    if (formIssues?.joints) {
      context.fillStyle = 'rgba(239, 68, 68, 0.5)'
      context.strokeStyle = '#ef4444'
      context.lineWidth = 3
      formIssues.joints.forEach((index) => {
        const joint = landmarks[index]
        if (joint && (joint.visibility ?? 1) > 0.4) {
          context.beginPath()
          context.arc(joint.x * width, joint.y * height, 12, 0, Math.PI * 2)
          context.fill()
          context.stroke()
        }
      })
    }
  }, [exerciseMode])

  const getExerciseConfig = useCallback((mode) => {
    const map = {
      squat: {
        label: 'Squat',
        downThreshold: 130,
        upThreshold: 155,
        minRepInterval: 550,
        stageLabels: { down: 'Down', up: 'Stand' },
        instructions: [
          'Stand sideways so the camera sees your profile',
          'Ensure your entire body (shoulders to ankles) is visible',
          'Keep your back straight while going down',
          'Squat until your knees are at ~90 degrees'
        ]
      },
      pushup: {
        label: 'Push-up',
        downThreshold: 95,
        upThreshold: 155,
        minRepInterval: 450,
        stageLabels: { down: 'Down', up: 'Up' },
        instructions: [
          'Position yourself sideways to the camera',
          'Ensure arms, shoulders, and full body are visible',
          'Keep your body straight - don\'t let hips sag',
          'Lower until elbows are at ~90 degrees'
        ]
      },
      bicep_curl: {
        label: 'Bicep Curl',
        downThreshold: 145,
        upThreshold: 65,
        minRepInterval: 350,
        stageLabels: { down: 'Extended', up: 'Contracted' },
        instructions: [
          'Stand facing or slightly sideways to the camera',
          'Ensure your torso and arms are clearly visible',
          'Keep your back straight and shoulders level',
          'Extend arms fully downwards to start'
        ]
      },
      shoulder_press: {
        label: 'Shoulder Press',
        downThreshold: 95,
        upThreshold: 155,
        minRepInterval: 400,
        stageLabels: { down: 'Lowered', up: 'Pressed' },
        instructions: [
          'Stand facing the camera',
          'Keep full upper body visible including arms',
          'Press weights directly overhead',
          'Keep core tight and avoid arching back'
        ]
      },
      lunge: {
        label: 'Lunge',
        downThreshold: 118,
        upThreshold: 155,
        minRepInterval: 550,
        stageLabels: { down: 'Down', up: 'Stand' },
        instructions: [
          'Stand sideways to show your profile',
          'Step forward and lower your back knee',
          'Keep front knee aligned over ankle',
          'Push back to starting position'
        ]
      },
    }
    return map[mode] || map.squat
  }, [])

  const getModeAngles = useCallback((landmarks, mode) => {
    const leftShoulder = landmarks[11]
    const rightShoulder = landmarks[12]
    const leftElbow = landmarks[13]
    const rightElbow = landmarks[14]
    const leftWrist = landmarks[15]
    const rightWrist = landmarks[16]
    const leftHip = landmarks[23]
    const rightHip = landmarks[24]
    const leftKnee = landmarks[25]
    const rightKnee = landmarks[26]
    const leftAnkle = landmarks[27]
    const rightAnkle = landmarks[28]

    const leftKneeAngle = leftHip && leftKnee && leftAnkle ? calculateAngle(leftHip, leftKnee, leftAnkle) : null
    const rightKneeAngle = rightHip && rightKnee && rightAnkle ? calculateAngle(rightHip, rightKnee, rightAnkle) : null
    const leftElbowAngle = leftShoulder && leftElbow && leftWrist ? calculateAngle(leftShoulder, leftElbow, leftWrist) : null
    const rightElbowAngle = rightShoulder && rightElbow && rightWrist ? calculateAngle(rightShoulder, rightElbow, rightWrist) : null

    if (mode === 'pushup' || mode === 'bicep_curl' || mode === 'shoulder_press') {
      if (!leftElbowAngle || !rightElbowAngle) return null
      return {
        leftAngle: leftElbowAngle,
        rightAngle: rightElbowAngle,
        activeAngle: (leftElbowAngle + rightElbowAngle) / 2,
      }
    }

    if (mode === 'lunge') {
      if (!leftKneeAngle || !rightKneeAngle) return null
      const active = Math.min(leftKneeAngle, rightKneeAngle)
      return {
        leftAngle: leftKneeAngle,
        rightAngle: rightKneeAngle,
        activeAngle: active,
      }
    }

    if (!leftKneeAngle || !rightKneeAngle) return null
    return {
      leftAngle: leftKneeAngle,
      rightAngle: rightKneeAngle,
      activeAngle: (leftKneeAngle + rightKneeAngle) / 2,
    }
  }, [])

  const processPose = useCallback((result) => {
      if (!result?.landmarks?.length) {
        updatePostureAdvice('No person detected', 'text-yellow-500')
        return { formIssues: null, currentAngle: 0 }
      }
      const landmarks = result.landmarks[0]

      const config = getExerciseConfig(exerciseMode)
      const modeAngles = getModeAngles(landmarks, exerciseMode)
      if (!modeAngles) {
        updatePostureAdvice('Ensure full body is visible', 'text-yellow-400')
        return { formIssues: null, currentAngle: 0 }
      }

      // Use moving average for smoother angle readings
      const smoothedAngle = getSmoothedAngle(modeAngles.activeAngle)
      setLastAngle(Math.round(smoothedAngle))

      const angleGap = Math.abs(modeAngles.leftAngle - modeAngles.rightAngle)
      const score = Math.max(0, Math.min(100, 100 - angleGap * 2.5))
      setSymmetryScore(Math.round(score))

      // Check for form issues based on exercise type
      let formIssues = null
      const leftShoulder = landmarks[11]
      const rightShoulder = landmarks[12]
      const leftHip = landmarks[23]
      const rightHip = landmarks[24]

      if (exerciseMode === 'bicep_curl') {
        // Check if shoulders are level
        if (leftShoulder && rightShoulder &&
            leftShoulder.visibility > 0.4 && rightShoulder.visibility > 0.4) {
          const video = videoRef.current
          const height = video?.videoHeight || 480
          const shoulderDiff = Math.abs((leftShoulder.y - rightShoulder.y) * height)

          if (shoulderDiff > 40) {
            updatePostureAdvice('Keep shoulders level!', 'text-red-400')
            formIssues = { joints: [11, 12] }
          } else if (angleGap > 20) {
            updatePostureAdvice('Keep both arms moving together', 'text-yellow-400')
          } else {
            updatePostureAdvice('Good form. Keep going!', 'text-green-400')
          }
        } else {
          updatePostureAdvice('Tracking...', 'text-blue-400')
        }
      } else if (exerciseMode === 'squat') {
        // Check back posture during squats
        if (leftShoulder && leftHip && leftShoulder.visibility > 0.4 && leftHip.visibility > 0.4) {
          const vertical = { x: leftHip.x, y: leftHip.y - 0.2 }
          const backAngle = calculateAngle(leftShoulder, leftHip, vertical)

          if (backAngle > 45) {
            updatePostureAdvice('Straighten your back!', 'text-red-400')
            formIssues = { joints: [11, 23] }
          } else if (smoothedAngle < 90 && smoothedAngle > 70) {
            updatePostureAdvice('Great depth! Return to standing', 'text-green-400')
          } else {
            updatePostureAdvice('Great squat form!', 'text-green-400')
          }
        } else {
          updatePostureAdvice('Tracking...', 'text-blue-400')
        }
      } else if (exerciseMode === 'pushup') {
        // Check if body is straight (hips in line with shoulders and feet)
        if (leftShoulder && leftHip && leftShoulder.visibility > 0.4 && leftHip.visibility > 0.4) {
          const video = videoRef.current
          const height = video?.videoHeight || 480
          const hipDrop = Math.abs((leftShoulder.y - leftHip.y) * height)

          if (hipDrop < 50) {
            updatePostureAdvice('Keep body straight, don\'t let hips sag', 'text-yellow-400')
            formIssues = { joints: [11, 23] }
          } else {
            updatePostureAdvice('Good push-up form!', 'text-green-400')
          }
        }
      } else {
        updatePostureAdvice('Tracking...', 'text-blue-400')
      }

      // Rep counting logic
      if (exerciseMode === 'bicep_curl') {
        if (smoothedAngle > config.downThreshold) {
          stageRef.current = config.stageLabels.down
          setMovementStage(config.stageLabels.down)
        }

        if (smoothedAngle < config.upThreshold && stageRef.current === config.stageLabels.down) {
          const now = Date.now()
          if (now - lastRepAtRef.current < config.minRepInterval) return { formIssues, currentAngle: smoothedAngle }
          lastRepAtRef.current = now
          stageRef.current = config.stageLabels.up
          setMovementStage(config.stageLabels.up)
          setReps((value) => value + 1)
        }
      } else {
        if (smoothedAngle < config.downThreshold) {
          stageRef.current = config.stageLabels.down
          setMovementStage(config.stageLabels.down)
        }

        if (smoothedAngle > config.upThreshold && stageRef.current === config.stageLabels.down) {
          const now = Date.now()
          if (now - lastRepAtRef.current < config.minRepInterval) return { formIssues, currentAngle: smoothedAngle }
          lastRepAtRef.current = now
          stageRef.current = config.stageLabels.up
          setMovementStage(config.stageLabels.up)
          setReps((value) => value + 1)
        }
      }

      return { formIssues, currentAngle: smoothedAngle }
    }, [exerciseMode, getExerciseConfig, getModeAngles, getSmoothedAngle, updatePostureAdvice])

  const runDetection = useCallback(() => {
    const video = videoRef.current
    const poseLandmarker = poseLandmarkerRef.current

    if (!video || !poseLandmarker || !isStreamingRef.current) return

    if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime
      const result = poseLandmarker.detectForVideo(video, performance.now())
      const { formIssues, currentAngle } = processPose(result)
      drawPoseOverlay(result, formIssues, currentAngle || 0)
    }

    animationRef.current = requestAnimationFrame(runDetection)
  }, [drawPoseOverlay, processPose])

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }

    setIsStreaming(false)
    isStreamingRef.current = false
    sessionStartRef.current = 0
    lastRepAtRef.current = 0
    angleHistoryRef.current = []
    setSessionSeconds(0)
    stageRef.current = 'Stand'
    setMovementStage('Stand')
    setLastAngle(180)
    setSymmetryScore(100)
    setPostureAdvice('')
  }, [])

  const loadDevices = useCallback(async () => {
    if (!cameraSupported) return
    try {
      const all = await navigator.mediaDevices.enumerateDevices()
      const cams = all.filter((d) => d.kind === 'videoinput')
      setDevices(cams)
      if (!selectedDeviceId && cams[0]) {
        setSelectedDeviceId(cams[0].deviceId)
      }
    } catch {
      setDevices([])
    }
  }, [cameraSupported, selectedDeviceId])

  const loadPoseLandmarker = useCallback(async () => {
    if (poseLandmarkerRef.current) {
      setIsPoseReady(true)
      return
    }

    setIsPoseLoading(true)
    try {
      const vision = await import('@mediapipe/tasks-vision')
      const filesetResolver = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
      )

      try {
        poseLandmarkerRef.current = await vision.PoseLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        })
      } catch {
        poseLandmarkerRef.current = await vision.PoseLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        })
      }

      setIsPoseReady(true)
    } catch {
      setIsPoseReady(false)
      setErrorMessage('Pose engine failed to load. Check internet and reload page.')
    } finally {
      setIsPoseLoading(false)
    }
  }, [])

  const requestCameraStream = useCallback(async (deviceId) => {
    const tryConstraints = []

    if (deviceId) {
      tryConstraints.push({
        video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      tryConstraints.push({
        video: { deviceId: { ideal: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
    }

    tryConstraints.push(
      { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      { video: true, audio: false },
    )

    let lastError = null
    for (const constraints of tryConstraints) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
        return mediaStream
      } catch (error) {
        lastError = error
      }
    }

    throw lastError || new Error('Unable to open camera stream')
  }, [])

  const startCamera = useCallback(
    async (deviceId = selectedDeviceId) => {
      if (!cameraSupported) {
        setErrorMessage('Camera not supported in this browser.')
        return
      }

      setErrorMessage('')
      setIsStarting(true)

      try {
        stopCamera()

        const mediaStream = await requestCameraStream(deviceId)
        streamRef.current = mediaStream
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          await videoRef.current.play()
        }

        setIsStreaming(true)
        isStreamingRef.current = true
        sessionStartRef.current = Date.now()
        await loadDevices()

        if (!poseLandmarkerRef.current) {
          loadPoseLandmarker()
        }
      } catch (error) {
        if (error?.name === 'NotAllowedError') {
          setErrorMessage('Permission denied. Please allow camera access.')
        } else if (error?.name === 'NotReadableError') {
          setErrorMessage('Camera is busy in another app. Close other camera apps and retry.')
        } else if (error?.name === 'NotFoundError') {
          setErrorMessage('No camera found on this device.')
        } else {
          setErrorMessage('Failed to open camera. Retry and ensure browser has camera permission.')
        }
        setIsStreaming(false)
      } finally {
        setIsStarting(false)
      }
    },
    [cameraSupported, loadDevices, loadPoseLandmarker, requestCameraStream, selectedDeviceId, stopCamera],
  )

  useEffect(() => {
    loadDevices()
  }, [loadDevices])

  useEffect(() => {
    loadPoseLandmarker()
  }, [loadPoseLandmarker])

  useEffect(() => {
    if (isStreaming && poseLandmarkerRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      runDetection()
    }
  }, [isStreaming, isPoseReady, runDetection])

  useEffect(() => {
    return () => {
      stopCamera()
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close()
        poseLandmarkerRef.current = null
      }
    }
  }, [stopCamera])

  useEffect(() => {
    if (!isStreaming) return undefined
    const timer = window.setInterval(() => {
      if (sessionStartRef.current) {
        setSessionSeconds(Math.floor((Date.now() - sessionStartRef.current) / 1000))
      }
    }, 1000)
    return () => window.clearInterval(timer)
  }, [isStreaming])

  const progress = Math.min(100, Math.round((reps / Math.max(1, targetReps)) * 100))

  const handleSaveWorkout = useCallback(async () => {
    if (reps === 0) {
      setSaveMessage('No reps to save')
      setTimeout(() => setSaveMessage(''), 3000)
      return
    }

    setIsSaving(true)
    setSaveMessage('')

    try {
      const workoutData = {
        exercise_name: getExerciseConfig(exerciseMode).label,
        reps: reps,
        duration_minutes: Math.floor(sessionSeconds / 60),
        form_score: symmetryScore,
        calories_burned: Math.max(30, reps * 4),
      }

      await saveWorkoutSession(workoutData)
      setSaveMessage('✓ Workout saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      setSaveMessage(`✗ Failed to save: ${error.message}`)
      setTimeout(() => setSaveMessage(''), 5000)
    } finally {
      setIsSaving(false)
    }
  }, [reps, sessionSeconds, symmetryScore, exerciseMode, getExerciseConfig])

  useEffect(() => {
    stageRef.current = getExerciseConfig(exerciseMode).stageLabels.up
    setMovementStage(getExerciseConfig(exerciseMode).stageLabels.up)
    setReps(0)
    lastRepAtRef.current = 0
    angleHistoryRef.current = []
    setLastAngle(180)
    setPostureAdvice('Ready. Start the camera.')
    setAdviceColor('text-blue-400')
  }, [exerciseMode, getExerciseConfig])

  // Trigger glow effect when reps increase
  useEffect(() => {
    if (reps > 0) {
      setRepGlowActive(true)
      const timeout = setTimeout(() => setRepGlowActive(false), 300)
      return () => clearTimeout(timeout)
    }
  }, [reps])

  return (
    <motion.div
      className="page-container feature-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <section className="feature-hero glass">
        <div className="feature-badge"><Camera size={14} /> See Me Counting</div>
        <h1>Live Rep Counting Page</h1>
        <p>Open camera and perform squats. Reps count automatically when you move from Down to Stand.</p>
      </section>

      <section className="feature-grid">
        <article className="feature-card glass" style={{ gridColumn: '1 / -1', position: 'relative' }}>
          <h3 style={{ marginBottom: '16px' }}>Live Camera Session</h3>

          <div className="camera-preview-wrap counter-preview-wrap" style={{ position: 'relative' }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`camera-preview ${isStreaming ? '' : 'camera-preview-hidden'}`}
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas
              ref={canvasRef}
              className={`pose-overlay ${isStreaming ? '' : 'camera-preview-hidden'}`}
              style={{ transform: 'scaleX(-1)' }}
            />

            {/* Loading Overlay for Pose Engine */}
            {isPoseLoading && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(247, 250, 248, 0.95)',
                zIndex: 20,
                backdropFilter: 'blur(4px)',
                transition: 'opacity 0.5s'
              }}>
                <svg style={{ width: '48px', height: '48px', marginBottom: '16px', animation: 'spin 1s linear infinite' }} fill="none" stroke="#10b981" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span style={{ fontSize: '20px', fontWeight: '600', color: '#2f6fb2', marginBottom: '8px' }}>Downloading AI Model...</span>
                <span style={{ fontSize: '14px', color: '#5e6878', textAlign: 'center', padding: '0 16px' }}>MediaPipe Pose (runs 100% locally in your browser)</span>
              </div>
            )}

            {/* Camera Off Prompt */}
            {!isStreaming && !isPoseLoading && (
              <div className="camera-empty-state" style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                <Camera size={64} style={{ opacity: 0.5, marginBottom: '16px' }} />
                <p style={{ fontWeight: '500', fontSize: '16px' }}>Camera is turned off</p>
                <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>Click "Start Camera" to begin</p>
              </div>
            )}

            {/* Rep Counter Overlay */}
            <div className="counter-overlay glass" style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              padding: '20px 24px',
              borderRadius: '16px',
              backgroundColor: repGlowActive ? '#eaf7f0' : '#f6f9fc',
              border: repGlowActive ? '2px solid #2f6fb2' : '1px solid #dbe3ef',
              transition: 'all 0.3s ease',
              backdropFilter: 'none',
              textAlign: 'center',
              minWidth: '120px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#64748b', display: 'block', marginBottom: '8px' }}>REPS</span>
              <strong style={{
                fontSize: '56px',
                fontWeight: '800',
                color: repGlowActive ? '#2f6fb2' : '#1f2e43',
                display: 'block',
                lineHeight: 1,
                transition: 'all 0.3s ease',
                transform: repGlowActive ? 'scale(1.1)' : 'scale(1)'
              }}>{reps}</strong>
              <small style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Target: {targetReps}
              </small>
            </div>
          </div>

          <div className="inline-form" style={{ marginBottom: 10 }}>
            <label htmlFor="exerciseMode">Exercise mode</label>
            <select
              id="exerciseMode"
              value={exerciseMode}
              onChange={(e) => setExerciseMode(e.target.value)}
            >
              <option value="squat">Squat</option>
              <option value="pushup">Push-up</option>
              <option value="bicep_curl">Bicep Curl</option>
              <option value="shoulder_press">Shoulder Press</option>
              <option value="lunge">Lunge</option>
            </select>
          </div>

          <div className="inline-form" style={{ marginBottom: 10 }}>
            <label htmlFor="targetReps">Target reps</label>
            <input
              id="targetReps"
              type="number"
              min="1"
              value={targetReps}
              onChange={(e) => setTargetReps(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>

          {devices.length > 1 && (
            <div className="inline-form" style={{ marginBottom: 10 }}>
              <label htmlFor="cameraSelect">Camera device</label>
              <select
                id="cameraSelect"
                value={selectedDeviceId}
                onChange={(e) => {
                  const next = e.target.value
                  setSelectedDeviceId(next)
                  if (isStreaming) {
                    startCamera(next)
                  }
                }}
              >
                {devices.map((device, index) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>

          {postureAdvice && (
            <div className="glass" style={{
              padding: '20px',
              marginBottom: '20px',
              borderRadius: '16px',
              backgroundColor: '#f6f9fc',
              border: '1px solid #dbe3ef'
            }}>
              <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#64748b', marginBottom: '12px' }}>
                Live AI Feedback
              </p>
              <p className={`${adviceColor} font-bold text-2xl transition-colors duration-300`} style={{ lineHeight: '1.4', color: '#2f3f55' }}>
                {postureAdvice}
              </p>
            </div>
          )}

          {/* Statistics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {/* Stage Box */}
            <div className="glass" style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: '#f6f9fc',
              border: '1px solid #dbe3ef',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#64748b', marginBottom: '8px' }}>Stage</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#60a5fa' }}>{movementStage}</p>
            </div>

            {/* Angle Box */}
            <div className="glass" style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: '#f6f9fc',
              border: '1px solid #dbe3ef',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#64748b', marginBottom: '8px' }}>Joint Angle</p>
              <p style={{ fontSize: '32px', fontWeight: '800', color: '#22d3ee' }}>{lastAngle}°</p>
            </div>

            {/* Symmetry Box */}
            <div className="glass" style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: '#f6f9fc',
              border: '1px solid #dbe3ef',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#64748b', marginBottom: '8px' }}>Symmetry</p>
              <p style={{ fontSize: '32px', fontWeight: '800', color: symmetryScore >= 80 ? '#10b981' : symmetryScore >= 60 ? '#f59e0b' : '#ef4444' }}>{symmetryScore}%</p>
            </div>

            {/* Session Time Box */}
            <div className="glass" style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: '#f6f9fc',
              border: '1px solid #dbe3ef',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#64748b', marginBottom: '8px' }}>Session</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#a78bfa' }}>{Math.floor(sessionSeconds / 60)}:{String(sessionSeconds % 60).padStart(2, '0')}</p>
            </div>
          </div>

          <div className="camera-actions">
            <button className="btn-primary" type="button" onClick={() => startCamera()} disabled={isStarting}>
              {isStarting ? 'Starting...' : 'Start Camera'}
            </button>
            <button className="btn-primary btn-secondary" type="button" onClick={stopCamera}>Stop Camera</button>
            <button className="btn-primary" type="button" onClick={handleSaveWorkout} disabled={isSaving || reps === 0}>
              <Save size={16} /> {isSaving ? 'Saving...' : 'Save Workout'}
            </button>
            <button className="btn-primary btn-secondary" type="button" onClick={() => setReps((value) => value + 1)}>
              +1 Rep (Fallback)
            </button>
            <button className="btn-primary btn-secondary" type="button" onClick={() => setReps(0)}>
              <RotateCcw size={16} /> Reset
            </button>
          </div>

          {saveMessage && <p className={`camera-hint ${saveMessage.includes('✓') ? '' : 'camera-error'}`}>{saveMessage}</p>}

          {/* Exercise Instructions */}
          <div className="glass" style={{
            padding: '16px',
            marginTop: '16px',
            borderRadius: '12px',
            backgroundColor: '#edf4ff',
            border: '1px solid #bfd4f3'
          }}>
            <p style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', color: '#2f6fb2', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Instructions for {getExerciseConfig(exerciseMode).label}
            </p>
            <ul style={{ listStyle: 'disc', paddingLeft: '20px', fontSize: '14px', color: '#475569', lineHeight: '1.8' }}>
              {getExerciseConfig(exerciseMode).instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ul>
          </div>

          <p className="camera-hint">Tip: camera should appear immediately; pose counting may take a few seconds to become Ready. Keep full body visible from side angle.</p>
          {errorMessage && <p className="camera-error">{errorMessage}</p>}
          {!cameraSupported && <p className="camera-error">Camera API is not available in this browser.</p>}
        </article>
      </section>
    </motion.div>
  )
}
