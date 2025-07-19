# Dependency Fix Instructions

## Issue
The @mui/x-date-pickers package has a peer dependency conflict with Material-UI v6.

## Solution Options

### Option 1: Use Legacy Peer Dependencies (Recommended)
```bash
# Clean up existing installations
rm -rf node_modules package-lock.json

# Install with legacy peer deps
npm install --legacy-peer-deps

# Start the app
npm run dev
```

### Option 2: Use Force Flag
```bash
# Clean up existing installations
rm -rf node_modules package-lock.json

# Install with force flag
npm install --force

# Start the app
npm run dev
```

### Option 3: Use Fixed Startup Script
```bash
chmod +x start-app-fixed.sh
./start-app-fixed.sh
```

## Quick Commands to Run Right Now

Run these commands in your terminal:

```bash
cd "/mnt/c/Users/vijay/Cursor Projects/VitaCheckLabs_UI/vitachecklabs-ui"
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run dev
```

This should resolve the dependency conflict and start the application successfully.

## Alternative: Temporary Fix for Date Pickers

If you continue to have issues, you can temporarily comment out the date picker imports in the Reports component and still test most of the functionality:

1. The Lab Tests page (VIT-33) should work completely
2. The Reports page (VIT-34) will work except for date range filtering

## Expected Result
After running the fix commands, you should see:
```
VITE v7.0.4 ready in 1234ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```