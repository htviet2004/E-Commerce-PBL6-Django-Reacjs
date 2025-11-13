from rest_framework import serializers
from .models import Category, Product
from reviews.models import Review
from django.db.models import Avg, Count

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ("id", "name", "slug", "product_count")

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    image = serializers.SerializerMethodField()
    seller_name = serializers.SerializerMethodField()
    rating_avg = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "image",
            "category",
            "seller_id",
            "seller_name",
            "stock",
            "created_at",
            "rating_avg",
            "rating_count",
        ]

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image:
            try:
                url = obj.image.url
            except Exception:
                url = str(obj.image)
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return None

    def get_seller_name(self, obj):
        """Lấy full_name từ bảng users_user"""
        if obj.seller_id:
            return getattr(obj.seller, "full_name", None) or obj.seller.username
        return None

    def get_rating_avg(self, obj):
        agg = Review.objects.filter(product=obj).aggregate(a=Avg('rating'))
        return round(agg['a'] or 0, 2)

    def get_rating_count(self, obj):
        agg = Review.objects.filter(product=obj).aggregate(c=Count('id'))
        return agg['c'] or 0

class ProductCreateSerializer(serializers.ModelSerializer):
    # dùng khi cần create/update; category nhận id
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), allow_null=True, required=False)

    class Meta:
        model = Product
        fields = ["id", "name", "description", "price", "image", "category"]

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['seller'] = request.user
        return super().create(validated_data)