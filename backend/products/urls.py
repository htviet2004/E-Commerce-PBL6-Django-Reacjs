from django.urls import path
from .views import ProductCreateView, CategoryListCreateView

urlpatterns = [
    path('', ProductCreateView.as_view(), name='product-create'),               # POST /api/products/
    path('categories/', CategoryListCreateView.as_view(), name='category-list'),# GET /api/products/categories/
]