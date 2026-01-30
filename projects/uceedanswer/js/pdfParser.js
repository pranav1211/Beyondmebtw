// PDF Parsing Module

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let allText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        allText += pageText + ' ';
    }
    
    return allText.trim();
}

/**
 * Parse question paper text into structured format
 */
function parseQuestionPaper(text) {
    // Remove participant information
    text = text.replace(/UCEED \d{4}.*?Subject UCEED \d{4}\./g, '');
    
    const questionBlocks = text.split(/Q\.\s*(\d+)/g).filter(s => s.trim());
    
    const result = {
        section_1_nat: [],
        section_2_msq: [],
        section_3_mcq: []
    };
    
    for (let i = 0; i < questionBlocks.length; i += 2) {
        if (i + 1 >= questionBlocks.length) break;
        
        const questionNum = parseInt(questionBlocks[i].trim());
        const questionContent = questionBlocks[i + 1];
        
        const question = parseQuestion(questionNum, questionContent);
        
        if (question) {
            // Categorize by question type
            if (question.question_type === 'NAT') {
                result.section_1_nat.push(question);
            } else if (question.question_type === 'MSQ') {
                result.section_2_msq.push(question);
            } else if (question.question_type === 'MCQ') {
                result.section_3_mcq.push(question);
            }
        }
    }
    
    return result;
}

/**
 * Parse individual question
 */
function parseQuestion(questionNum, content) {
    try {
        const questionIdMatch = content.match(/Question ID\s*:\s*(\d+)/);
        const questionId = questionIdMatch ? questionIdMatch[1] : null;
        
        const statusMatch = content.match(/Status\s*:\s*(Answered|Not Answered|Marked for Review|Not Visited)/);
        const status = statusMatch ? statusMatch[1] : 'Unknown';
        
        const hasOptions = content.includes('Options');
        
        let questionText = '';
        let options = [];
        let answer = null;
        let questionType = '';
        
        if (hasOptions) {
            const textMatch = content.match(/^(.*?)Options/s);
            questionText = textMatch ? textMatch[1].trim() : '';
            questionText = questionText.replace(/Question ID.*$/s, '').trim();
            
            const optionsSection = content.match(/Options(.*?)Question ID/s);
            if (optionsSection) {
                const optionsText = optionsSection[1];
                const optionMatches = optionsText.match(/(\d+)\.\s*([^0-9]+?)(?=\d+\.|$)/g);
                
                if (optionMatches) {
                    options = optionMatches.map(opt => {
                        const match = opt.match(/(\d+)\.\s*(.+)/);
                        return match ? {
                            number: parseInt(match[1]),
                            text: match[2].trim()
                        } : null;
                    }).filter(Boolean);
                }
            }
            
            const answerMatch = content.match(/Chosen Option\s*:\s*([\d,\s]+)/);
            if (answerMatch) {
                const answerStr = answerMatch[1].trim();
                if (answerStr.includes(',')) {
                    answer = answerStr.split(',').map(a => parseInt(a.trim()));
                    questionType = 'MSQ';
                } else {
                    answer = parseInt(answerStr);
                    questionType = 'MCQ';
                }
            }
        } else {
            questionText = content.replace(/Given Answer.*$/s, '').trim();
            questionText = questionText.replace(/Question ID.*$/s, '').trim();
            
            const answerMatch = content.match(/Given Answer\s*:\s*([\d.]+)/);
            answer = answerMatch ? parseFloat(answerMatch[1]) : null;
            questionType = 'NAT';
        }
        
        return {
            question_number: questionNum,
            question_text: questionText,
            question_type: questionType,
            options: options.length > 0 ? options : null,
            answer: answer,
            status: status,
            question_id: questionId
        };
    } catch (error) {
        console.error(`Error parsing question ${questionNum}:`, error);
        return null;
    }
}
