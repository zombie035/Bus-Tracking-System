# Dashboard Images Setup Instructions

## 📁 Image Placement

Please place your uploaded dashboard images in the following directory:

```
client/public/images/dashboards/
```

## 🖼️ Required Images

1. **Student Dashboard** → `student-dashboard.png`
2. **Driver Dashboard** → `driver-dashboard.png`  
3. **Admin Dashboard** → `admin-dashboard.png`

## 🎯 File Structure

```
client/
├── public/
│   └── images/
│       └── dashboards/
│           ├── student-dashboard.png
│           ├── driver-dashboard.png
│           └── admin-dashboard.png
└── src/
    └── pages/
        └── SimpleLandingPage.jsx (updated to reference these images)
```

## ✅ After Placing Images

Once the images are placed in the correct location, the landing page will:

1. **Display actual dashboard screenshots** instead of placeholders
2. **Apply 3D animations** to the real images
3. **Show hover effects** with play button overlay
4. **Maintain responsive design** across all screen sizes

## 🎨 3D Animation Features Applied

- **Scroll-triggered animations**: Images appear with parallax effects
- **Mouse-tracking 3D transforms**: Images rotate based on cursor position
- **Hover effects**: Play button overlay and shadow enhancement
- **Breathing animations**: Subtle scaling effects
- **Staggered timing**: Each card animates at different scroll positions

## 🚀 Testing

After placing images, visit `http://localhost:3000` and scroll down to see the dashboard screenshots section with full 3D animations!
