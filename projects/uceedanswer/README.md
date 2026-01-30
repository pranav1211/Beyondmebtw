# UCEED 2026 Score Calculator

A web-based application to calculate UCEED 2026 exam scores by comparing student responses with the official answer key.

## Features

- 📄 **PDF Upload with Drag & Drop** - Easy file upload with drag and drop support
- 🎯 **Smart Question Matching** - Uses Levenshtein distance algorithm to match questions
- 📊 **Detailed Score Breakdown** - Section-wise and question-wise analysis
- 📥 **PDF Report Generation** - Download complete results as a formatted PDF
- 🎨 **Clean Black & White Design** - Simple, professional interface with brown accents
- ⚡ **Modular Architecture** - Separate JS modules for easy debugging

## Project Structure

```
uceed-calculator/
├── index.html              # Main HTML file
├── answer_key.json         # Official answer key (DO NOT MODIFY)
├── css/
│   └── styles.css         # All styling
└── js/
    ├── config.js          # Configuration and constants
    ├── utils.js           # Utility functions
    ├── pdfParser.js       # PDF parsing logic
    ├── questionMatcher.js # Question matching algorithm
    ├── scoreCalculator.js # Score calculation logic
    ├── uiRenderer.js      # UI rendering functions
    ├── pdfGenerator.js    # PDF report generation
    └── main.js            # Main application logic
```

## How to Use

1. **Open the Application**
   - Open `index.html` in a modern web browser (Chrome, Firefox, Edge, Safari)
   - Ensure `answer_key.json` is in the same directory

2. **Upload Response PDF**
   - Click "Choose Response PDF" or drag and drop your UCEED response PDF
   - The file will be validated automatically

3. **Calculate Score**
   - Click "Calculate Score" button
   - Wait for the processing to complete

4. **View Results**
   - View your total score and section-wise breakdown
   - See question-by-question analysis with correct answers

5. **Download Report**
   - Click "Download Results PDF" to save a formatted PDF report

## Scoring System

### Section 1 - NAT (Numerical Answer Type)
- **14 questions** × 4 marks = 56 marks
- Correct: +4 marks
- Incorrect/Unattempted: 0 marks

### Section 2 - MSQ (Multiple Select Questions)
- **15 questions** × 4 marks = 60 marks
- All correct: +4 marks
- 3 correct (partial): +3 marks
- 2 correct (partial): +2 marks
- 1 correct (partial): +1 mark
- Any incorrect selection: -1 mark

### Section 3 - MCQ (Multiple Choice Questions)
- **28 questions** × 3 marks = 84 marks
- Correct: +3 marks
- Incorrect: -0.71 marks
- Unattempted: 0 marks

**Total: 200 marks**

## Technical Details

### Dependencies
- **PDF.js** (v3.11.174) - PDF parsing
- **jsPDF** (v2.5.1) - PDF generation

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### File Size Limit
- Maximum PDF upload size: 50MB

## Troubleshooting

### Answer key not loading
- Ensure `answer_key.json` is in the same directory as `index.html`
- Check browser console for errors
- Try refreshing the page

### PDF not uploading
- Ensure file is a valid PDF (not scanned image)
- Check file size is under 50MB
- Try a different browser

### Scores seem incorrect
- The calculator uses fuzzy matching to align questions
- Minor variations in question text are handled
- Check the question-by-question breakdown for details

## Credits

- **Inspiration**: [aaruxhhh's UCEED Score Calculator](https://aaruxhhh.github.io/UCEED-2026-Score-Calculator/)
- **Created by**: [Pranav Veeraghanta](https://beyondmebtw.com)
- **Copyright**: © beyondmebtw 2022-present

## Disclaimer

This tool is created to help students verify their scores after the exam. It is not affiliated with IIT Bombay or the official UCEED administration. Use at your own discretion.

## License

For personal and educational use only.
