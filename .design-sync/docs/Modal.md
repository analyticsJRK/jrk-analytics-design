---
category: Feedback
keywords: [modal, dialog, overlay, confirm, form dialog, showModal, popup, lightbox]
---

A modal dialog on the native `<dialog>`, opened with `showModal()`.

```tsx
{open && (
  <Modal
    title="Escalate 3 accounts?"
    description="They move to the collections queue."
    onClose={() => setOpen(false)}
    footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="danger-solid" onClick={escalate}>Escalate</Button></>}
  >
    <p>The on-site team is notified. This cannot be undone from here.</p>
  </Modal>
)}
```

## Notes

- **The platform does the hard parts**: top layer, focus trap, inertness behind,
  backdrop, Escape. `open` as an attribute would give none of them, so the
  component calls `showModal()` in an effect.
- **React state is the authority.** Escape, the close button and a backdrop click
  all call `onClose`; the dialog never closes itself. A file input's own `cancel`
  is ignored — it bubbles, and used to close the whole dialog.
- **A backdrop click must START on the backdrop.** A text-selection drag released
  outside the box does not close it.
- **`title` is the accessible name and is required.** `titleNode` changes what the
  heading shows (a count, a coloured word) without losing the name.
- **Centred and unbolded, by direction.** The title is regular weight, the body is
  centred, and `<strong>` inside is unbolded. Forms, lists, field stacks and
  tables opt back out to a leading edge by themselves; `align="start"` does it for
  anything else (a review's prose, a fact grid).
- **The footer is always reachable** — header and footer keep their height and
  the body scrolls.
- **It centres because `.jrk-modal` restates `margin: auto`.** base.css's
  `* { margin: 0 }` beats the UA rule that centres a dialog.
- Sizes: `sm` 400, `md` 560, `lg` 800.
