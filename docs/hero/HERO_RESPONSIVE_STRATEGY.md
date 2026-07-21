# Responsive Strategy

The scene uses five runtime tiers selected from viewport width, device memory, and logical CPU count. Each tier changes GLB size, orb particle count, signal-node count, background particle count, halo count, rock count, star counts, DPR, atmosphere, and scroll length.

Portrait cameras apply an aspect-derived distance multiplier so the entire orb and logo remain inside narrow screens. Mobile uses the 92 KB GLB, 10,000 primary particles, 360 signal nodes, 6,000 background particles, 1,100 halo particles, 7 instanced rocks, DPR 1.15, and no atmosphere mesh. Low mode uses the 54 KB GLB, 4,000 orb particles, 120 signal nodes, 2,500 background particles, 4 instanced rocks, DPR 1, and antialiasing disabled.

The composition has no text or controls to reflow. CSS prevents horizontal overflow and keeps the stage at the visual viewport height.
