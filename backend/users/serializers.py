from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Profile


class ProfileSerializer(serializers.ModelSerializer):
    """
    Serializer cho Profile model
    Dùng để hiển thị và cập nhật thông tin profile của user
    """
    class Meta:
        model = Profile
        fields = ['avatar', 'bio', 'address', 'city', 'country', 'postal_code']
        extra_kwargs = {
            'avatar': {'required': False},
            'bio': {'required': False},
            'address': {'required': False},
            'city': {'required': False},
            'country': {'required': False},
            'postal_code': {'required': False},
        }


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer cho User model
    Dùng để hiển thị thông tin user (GET request)
    Bao gồm cả thông tin profile nếu có
    """
    profile = ProfileSerializer(read_only=True)  # Nested serializer
    
    class Meta:
        model = User
        fields = [
            'user_id', 
            'username', 
            'email', 
            'full_name', 
            'phone', 
            'user_type', 
            'status', 
            'created_at',
            'updated_at',
            'profile',  # Thông tin profile
        ]
        read_only_fields = ['user_id', 'created_at', 'updated_at']


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer cho đăng ký user mới
    Dùng cho POST request tạo tài khoản
    """
    password = serializers.CharField(
        write_only=True,  # Không trả về trong response
        required=True,
        style={'input_type': 'password'},
        validators=[validate_password]  # Validate theo Django password rules
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'password_confirm',
            'full_name',
            'phone',
            'user_type',
        ]
        extra_kwargs = {
            'full_name': {'required': False},
            'phone': {'required': False},
            'user_type': {'required': False},  # Default là 'buyer'
        }
    
    def validate(self, attrs):
        """
        Kiểm tra password và password_confirm có khớp không
        """
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Passwords do not match"
            })
        return attrs
    
    def validate_username(self, value):
        """
        Kiểm tra username có hợp lệ không
        """
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        
        # Không cho phép username có khoảng trắng
        if ' ' in value:
            raise serializers.ValidationError("Username cannot contain spaces")
        
        return value
    
    def validate_email(self, value):
        """
        Kiểm tra email có tồn tại chưa
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value
    
    def create(self, validated_data):
        """
        Tạo user mới
        """
        # Xóa password_confirm vì không cần lưu vào database
        validated_data.pop('password_confirm')
        
        # Tạo user bằng CustomUserManager.create_user()
        user = User.objects.create_user(**validated_data)
        
        # Tự động tạo Profile cho user
        Profile.objects.create(user=user)
        
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer cho đăng nhập
    Không liên kết với model cụ thể
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer cho đổi mật khẩu
    Yêu cầu nhập mật khẩu cũ và mật khẩu mới
    """
    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """
        Kiểm tra new_password và new_password_confirm có khớp không
        """
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                "new_password": "New passwords do not match"
            })
        return attrs
    
    def validate_old_password(self, value):
        """
        Kiểm tra old_password có đúng không
        """
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value


class UpdateUserSerializer(serializers.ModelSerializer):
    """
    Serializer cho cập nhật thông tin user
    Không cho phép đổi username, email, user_type
    """
    profile = ProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = ['full_name', 'phone', 'profile']
    
    def update(self, instance, validated_data):
        """
        Cập nhật thông tin user và profile
        """
        # Lấy profile data nếu có
        profile_data = validated_data.pop('profile', None)
        
        # Cập nhật user
        instance.full_name = validated_data.get('full_name', instance.full_name)
        instance.phone = validated_data.get('phone', instance.phone)
        instance.save()
        
        # Cập nhật profile nếu có
        if profile_data:
            profile = instance.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        
        return instance


class UserListSerializer(serializers.ModelSerializer):
    """
    Serializer đơn giản cho danh sách user
    Chỉ hiển thị thông tin cơ bản
    """
    class Meta:
        model = User
        fields = ['user_id', 'username', 'email', 'full_name', 'user_type', 'status', 'created_at']
        read_only_fields = ['user_id', 'created_at']