from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_cart_cartitem'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='district',
            field=models.CharField(default='global', max_length=80),
        ),
    ]
