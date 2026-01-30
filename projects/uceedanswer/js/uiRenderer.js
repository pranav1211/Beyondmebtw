// UI Rendering Module

/**
 * Display results in the UI
 */
function displayResults(results) {
    // Update score summary
    document.getElementById('totalScore').textContent = results.total_score.toFixed(2);
    document.getElementById('totalCorrect').textContent = results.total_correct;
    document.getElementById('totalIncorrect').textContent = results.total_incorrect;
    document.getElementById('totalPartial').textContent = results.total_partial;
    document.getElementById('totalUnattempted').textContent = results.total_unattempted;
    
    // Render section breakdown
    renderSectionBreakdown(results);
    
    // Render detailed results
    const detailedResults = document.getElementById('detailedResults');
    detailedResults.innerHTML = '';
    
    let sectionIndex = 1;
    Object.values(results.sections).forEach(section => {
        const sectionHtml = generateSectionHTML(section, sectionIndex);
        detailedResults.innerHTML += sectionHtml;
        sectionIndex++;
    });
    
    // Show output section
    document.getElementById('outputSection').classList.add('active');
}

/**
 * Render section-wise breakdown
 */
function renderSectionBreakdown(results) {
    const breakdownGrid = document.getElementById('breakdownGrid');
    breakdownGrid.innerHTML = '';
    
    const sections = [
        { 
            key: 'section_1_nat', 
            name: 'Section 1 - NAT', 
            maxMarks: 56,
            color: '#28a745'
        },
        { 
            key: 'section_2_msq', 
            name: 'Section 2 - MSQ', 
            maxMarks: 60,
            color: '#ffc107'
        },
        { 
            key: 'section_3_mcq', 
            name: 'Section 3 - MCQ', 
            maxMarks: 84,
            color: '#dc3545'
        }
    ];
    
    sections.forEach(section => {
        const sectionData = results.sections[section.key];
        const card = document.createElement('div');
        card.className = 'breakdown-card';
        card.innerHTML = `
            <h4>${section.name}</h4>
            <div class="breakdown-item">
                <span class="breakdown-label">Correct:</span>
                <span class="breakdown-value">${sectionData.correct_count}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">Incorrect:</span>
                <span class="breakdown-value">${sectionData.incorrect_count}</span>
            </div>
            ${sectionData.partial_count !== undefined ? `
            <div class="breakdown-item">
                <span class="breakdown-label">Partial:</span>
                <span class="breakdown-value">${sectionData.partial_count}</span>
            </div>` : ''}
            <div class="breakdown-item">
                <span class="breakdown-label">Unattempted:</span>
                <span class="breakdown-value">${sectionData.unattempted_count}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">Score:</span>
                <span class="breakdown-value" style="color: #8B4513;">${sectionData.score} / ${section.maxMarks}</span>
            </div>
        `;
        breakdownGrid.appendChild(card);
    });
}

/**
 * Generate HTML for a section
 */
function generateSectionHTML(section, sectionIndex) {
    let html = `
        <div class="section-results" id="section-${sectionIndex}">
            <div class="section-header">
                <span>${section.name}</span>
                <span class="section-score">${section.score} marks</span>
            </div>
    `;
    
    section.questions.forEach(q => {
        html += generateQuestionCardHTML(q);
    });
    
    html += `</div>`;
    return html;
}

/**
 * Generate HTML for a question card
 */
function generateQuestionCardHTML(question) {
    const statusClass = question.status === 'correct' || question.is_correct ? 'correct' : 
                       question.status === 'partial' ? 'partial' : 
                       question.status === 'unattempted' ? '' : 'incorrect';
    
    const statusLabel = question.status === 'correct' || question.is_correct ? 'Correct' : 
                       question.status === 'partial' ? 'Partial' : 
                       question.status === 'unattempted' ? 'Unattempted' : 'Incorrect';
    
    const statusBadge = question.status === 'correct' || question.is_correct ? 'status-correct' : 
                       question.status === 'partial' ? 'status-partial' : 
                       question.status === 'unattempted' ? '' : 'status-incorrect';
    
    let html = `
        <div class="question-card ${statusClass}">
            <div class="question-header">
                <span class="question-number">Q.${question.question_number} [${question.question_type}]</span>
                ${statusLabel !== 'Unattempted' ? `<span class="question-status ${statusBadge}">${statusLabel}</span>` : ''}
            </div>
            <div class="question-text">${question.question_text}</div>
            <div class="answer-comparison">
                <div class="answer-row">
                    <span class="answer-label">Your Answer:</span>
                    <span class="answer-value ${question.is_correct || question.status === 'correct' ? 'answer-correct' : question.status === 'partial' ? '' : 'answer-incorrect'}">
                        ${formatAnswer(question.answer)}
                    </span>
                </div>
                <div class="answer-row">
                    <span class="answer-label">Correct Answer:</span>
                    <span class="answer-value answer-correct">
                        ${formatAnswer(question.correct_answer)}
                    </span>
                </div>
                <div class="marks-info">
                    Marks: ${question.marks} / ${question.max_marks}
                </div>
            </div>
        </div>
    `;
    
    return html;
}
