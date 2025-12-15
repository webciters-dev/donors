# Infinite Polling Bug Fix - Frontend Performance Issue

## The Problem

When a student logged in and clicked on "PROFILE", the browser made **infinite requests** to `/api/uploads`:

```
GET /api/uploads?studentId=... 304 (repeating 26+ times per second)
GET /api/uploads?studentId=... 304
GET /api/uploads?studentId=... 304
...
```

This caused:
- 🔴 UI freezing/lag
- 🔴 High server load
- 🔴 Battery drain
- 🔴 Bandwidth waste
- ✅ Stopped only when navigating away

## Root Cause

**React Hook Dependency Issue**: The `authHeader` object was being recreated on every render:

```javascript
// ❌ WRONG - Creates new object reference every render
const authHeader = token ? { Authorization: `Bearer ${token}` } : undefined;

useEffect(() => {
  // Fetch documents
}, [user?.studentId, authHeader]);  // authHeader is always "new"
```

Even though the **value** was the same (same token), React's dependency array uses **reference equality**, not value equality. So:
1. Component renders
2. `authHeader` is a new object `{ Authorization: "Bearer xyz" }`
3. `useEffect` sees `authHeader` as "changed" (different reference)
4. Runs the effect again → fetches documents
5. State updates → re-render
6. Back to step 1 → **infinite loop**

## The Solution

**Memoize `authHeader`** so it only changes when the token actually changes:

```javascript
// ✅ CORRECT - Memoized
const authHeader = useMemo(() => 
  token ? { Authorization: `Bearer ${token}` } : undefined,
  [token]  // Only recreate when token changes
);

useEffect(() => {
  // Fetch documents
}, [user?.studentId, authHeader]);  // authHeader is stable now
```

## Files Fixed

1. ✅ **StudentProfile.jsx** - CRITICAL (caused the issue in your screenshot)
2. ✅ **MyApplication.jsx** - Preventive
3. ✅ **SubAdminApplicationDetail.jsx** - Preventive
4. ✅ **AdminApplicationDetail.jsx** - Preventive
5. ✅ **FieldOfficerDashboard.jsx** - Preventive
6. ✅ **AdminApplications.jsx** - Preventive
7. ✅ **SubAdminDashboard.jsx** - Preventive

## Impact

- **Before**: Clicking PROFILE → infinite API calls → lag/hang
- **After**: Clicking PROFILE → single API call → smooth experience

## Technical Details

This is a common React pitfall when creating objects/arrays in component body and using them in dependency arrays. The pattern:

```javascript
// ❌ Bad
const obj = { key: value };
useEffect(() => { /* uses obj */ }, [obj]);  // obj changes every render

// ✅ Good
const obj = useMemo(() => ({ key: value }), [value]);
useEffect(() => { /* uses obj */ }, [obj]);  // obj stable unless value changes
```

## Testing

To verify the fix:
1. Open browser DevTools Network tab
2. Login as student
3. Click PROFILE
4. Should see ONE API call to `/api/uploads`, not infinite calls
5. UI should be smooth and responsive

---

**Status**: ✅ Fixed and ready to deploy
