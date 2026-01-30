// UI Rendering Module

/**
 * Display results in the UI
 */
function displayResults(results) {
    // Update score summary
    document.getElementById('totalScore').textContent = results.total_score.toFixed(2);
    document.getElementById('totalCorrect').textContent = results.total_correct;
    document.getElementById('totalIncorrect').textContent = results.total_incorrect;
    document.getElementById('totalUnattempted').textContent = results.total_unattempted;
    
    // Render detailed results
    const detailedResults = document.getElementById('detailedResults');
    detailedResults.innerHTML = '';
    
    Object.values(results.sections).forEach(section => {
        const sectionHtml = generateSectionHTML(section);
        detailedResults.innerHTML += sectionHtml;
    });
    
    // Show output section
    document.getElementById('outputSection').classList.add('active');
}

/**
 * Generate HTML for a section
 */
function generateSectionHTML(section) {
    let html = `
        <div class="section-results">
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
