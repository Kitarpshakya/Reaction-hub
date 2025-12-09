# Bonding System Testing Guide

## How to Test

1. **Open Browser Console** (F12) to see all debug logs
2. Navigate to `/compounds/create` page
3. Follow the test scenarios below

---

## Test Scenario 1: Creating Water (H₂O) - Manual Click Bonding

### Steps:
1. Click **Oxygen (O)** in left panel → Element added to canvas center
2. Click **Hydrogen (H)** twice in left panel → Two H atoms added
3. **Drag** one H close to O (within 120px) → Should see logs about distance checking
4. Click O to select it → Should see:
   - Blue ring around O (selected)
   - Green badge below O saying "+2" (can form 2 bonds)
   - Console log showing availableValence: 2
5. Click first H → Should see:
   - Bond line appears between O and H
   - Console logs showing "Created single bond"
   - O stays selected (still shows "+1" badge)
   - Console log: "O has 1 available valence after bonding"
6. Click second H → Should see:
   - Second bond line appears
   - O deselects (no more valence)
   - Formula updates to H₂O
   - Console log: "O has 0 available valence after bonding"

### Expected Console Logs:
```
Element clicked: O-... Current selected: null
Selecting element: O-...
Selected element: O { isBonded: false, availableValence: 2, totalBonds: 0 }
ElementBubble render: O { isSelected: true, isBonded: false, availableValence: 2 }

Element clicked: H-... Current selected: O-...
Attempting to create bond between O-... and H-...
Bond check O-H: { valence1: 2, valence2: 1, available1: 2, available2: 1, ... }
✓ Can bond O-H
Created single bond between O and H
O has 1 available valence after bonding

Element clicked: H-... Current selected: O-...
Attempting to create bond between O-... and H-...
Bond check O-H: { valence1: 2, valence2: 1, available1: 1, available2: 1, ... }
✓ Can bond O-H
Created single bond between O and H
O has 0 available valence after bonding
```

---

## Test Scenario 2: Auto-Bonding (Proximity)

### Steps:
1. Click **Oxygen (O)** → Added to canvas
2. Click **Hydrogen (H)** → Added to canvas
3. **Drag H very close to O** (less than 120px apart)
4. Click **Hydrogen (H)** again → New H should auto-bond if close enough

### Expected Console Logs:
```
Adding element: H at position: {x: 450, y: 320}
Checking auto-bond proximity (threshold: 120px)
  Distance to O-...: 85.4px ✓ NEARBY
Found 1 nearby elements for auto-bonding
Nearby elements for auto-bonding: ["O-..."]
Bond check H-O: { valence1: 1, valence2: 2, available1: 1, available2: 1, ... }
✓ Can bond H-O
Creating single bond between H and O
```

---

## Test Scenario 3: Re-bonding After Removal

### Steps:
1. Create H₂O (following Test 1)
2. Click the **red X button** on one H atom → H removed, bond breaks
3. Add a new H to canvas
4. Drag new H close to O
5. Click O, then click new H → Should bond successfully

### Expected Console Logs:
```
Removing element: H
# After removal, O should have available valence again

# Adding new H
Element clicked: O-... Current selected: null
Selecting element: O-...
Selected element: O { isBonded: true, availableValence: 1, totalBonds: 1 }
ElementBubble render: O { isSelected: true, isBonded: true, availableValence: 1 }

# Shows green "+1" badge = can form 1 more bond!

Element clicked: H-... Current selected: O-...
Bond check O-H: { valence1: 2, valence2: 1, available1: 1, available2: 1, ... }
✓ Can bond O-H
Created single bond between O and H
```

---

## Visual Indicators to Check

### Unbonded Element (no bonds):
- Yellow dashed ring
- Yellow "!" badge in bottom-left corner
- Lower opacity (70%)
- NOT included in formula

### Bonded Element:
- Normal solid ring
- Full opacity
- Included in formula

### Selected Element (when clicked):
- Blue ring (ring-blue-400)
- If can form more bonds: Green badge below showing "+X"
- If full valence: Red badge showing "FULL"

---

## Common Issues to Debug

### Issue: "No bonds forming"
**Check Console For:**
- "Cannot bond X-Y: insufficient valence" → Elements already at max bonds
- "Cannot bond X-Y: bond already exists" → Bond already created
- "Cannot bond X-Y: noble gas" → Trying to bond with He, Ne, Ar, etc.
- No "✓ Can bond" message → Check the reason above it

### Issue: "Visual indicators not showing"
**Check Console For:**
- "Selected element: X { isBonded: ..., availableValence: ... }" logs
- "ElementBubble render: X { isSelected: true, ... }" logs
- If logs appear but badges don't show, might be z-index/positioning issue

### Issue: "Auto-bonding not working"
**Check Console For:**
- "Distance to X: XXXpx" logs → Should be < 120px for auto-bond
- "Found 0 nearby elements" → Elements too far apart
- "✓ NEARBY" marker → Should appear for close elements

---

## Expected Valence Values

| Element | Valence | Can Bond With |
|---------|---------|---------------|
| H       | 1       | 1 element     |
| O       | 2       | 2 elements    |
| N       | 3       | 3 elements    |
| C       | 4       | 4 elements    |
| F, Cl, Br, I | 1  | 1 element     |
| S       | 2       | 2 elements    |

---

## Testing Checklist

- [ ] Manual click bonding works (O + H + H = H₂O)
- [ ] Auto-bonding works when elements dragged close
- [ ] Selected element shows green "+X" badge
- [ ] Element with full valence shows red "FULL" badge
- [ ] Unbonded elements show yellow "!" badge
- [ ] Element stays selected after bonding if more valence available
- [ ] Element deselects when valence is full
- [ ] Formula only includes bonded elements
- [ ] Can remove element and re-bond with new elements
- [ ] Console shows detailed logs for all operations

---

**If issues persist, share the console logs and I'll help debug!**
