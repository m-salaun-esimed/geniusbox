# Question Authoring (True/False)

## In-App Creation
1. Open the Question Editor section.
2. Enter question text.
3. Choose correct answer (`True` or `False`).
4. Optional: add category.
5. Click **Add question**.

## Quality Rules
- Keep questions unambiguous.
- Avoid duplicates in the same pack.
- Keep content original.

## Import/Export
- Export selected pack to JSON with the Export button.
- Import a valid pack JSON using the import text box.

## JSON Structure
```json
{
  "name": "My Pack",
  "questions": [
    {
      "id": "q_1",
      "prompt": "The Earth orbits the Sun.",
      "correctAnswer": "true",
      "category": "Science"
    }
  ]
}
```
