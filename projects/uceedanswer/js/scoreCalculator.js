// Score Calculator Module

/**
 * Calculate overall score from user responses and answer key
 */
function calculateScore(userResponses, answerKey) {
    const results = {
        sections: {},
        total_score: 0,
        total_correct: 0,
        total_incorrect: 0,
        total_partial: 0,
        total_unattempted: 0,
        total_questions: 0
    };

    // Process Section 1 (NAT)
    const section1 = processNATSection(
        userResponses.section_1_nat,
        answerKey.sections.section_1_nat
    );
    results.sections.section_1_nat = section1;

    // Process Section 2 (MSQ)
    const section2 = processMSQSection(
        userResponses.section_2_msq,
        answerKey.sections.section_2_msq
    );
    results.sections.section_2_msq = section2;

    // Process Section 3 (MCQ)
    const section3 = processMCQSection(
        userResponses.section_3_mcq,
        answerKey.sections.section_3_mcq
    );
    results.sections.section_3_mcq = section3;

    // Calculate totals
    [section1, section2, section3].forEach(section => {
        results.total_score += section.score;
        results.total_correct += section.correct_count;
        results.total_incorrect += section.incorrect_count;
        results.total_partial += section.partial_count || 0;
        results.total_unattempted += section.unattempted_count;
        results.total_questions += section.total_questions;
    });

    return results;
}

/**
 * Process NAT Section
 */
function processNATSection(userQuestions, answerKeySection) {
    const result = {
        name: 'Section 1 - NAT',
        score: 0,
        correct_count: 0,
        incorrect_count: 0,
        unattempted_count: 0,
        total_questions: answerKeySection.total_questions,
        questions: []
    };

    userQuestions.forEach(userQ => {
        const matchedQ = findMatchingQuestion(userQ, answerKeySection.questions);

        if (matchedQ) {
            const isAnswered = userQ.answer !== null && userQ.status === 'Answered';
            let isCorrect = false;
            let marks = 0;

            if (isAnswered) {
                if (matchedQ.answer_range) {
                    const [min, max] = matchedQ.answer_range.split('-').map(parseFloat);
                    const userAnswerNum = parseFloat(userQ.answer);
                    isCorrect = !isNaN(userAnswerNum) && userAnswerNum >= min && userAnswerNum <= max;
                } else {
                    const userAnswerNum = parseFloat(userQ.answer);
                    const correctAnswerNum = parseFloat(matchedQ.answer);

                    // Check both are valid numbers before comparing
                    if (!isNaN(userAnswerNum) && !isNaN(correctAnswerNum)) {
                        isCorrect = Math.abs(userAnswerNum - correctAnswerNum) < 0.01;
                    } else {
                        isCorrect = false;
                    }
                }

                marks = isCorrect ? answerKeySection.marks_per_question : 0;

                if (isCorrect) result.correct_count++;
                else result.incorrect_count++;
            }


            result.score += marks;
            result.questions.push({
                ...userQ,
                correct_answer: matchedQ.answer,
                is_correct: isCorrect,
                marks: marks,
                max_marks: answerKeySection.marks_per_question
            });
        }
    });

    return result;
}

/**
 * Process MSQ Section
 */
function processMSQSection(userQuestions, answerKeySection) {
    const result = {
        name: 'Section 2 - MSQ',
        score: 0,
        correct_count: 0,
        incorrect_count: 0,
        partial_count: 0,
        unattempted_count: 0,
        total_questions: answerKeySection.total_questions,
        questions: []
    };

    userQuestions.forEach(userQ => {
        const matchedQ = findMatchingQuestion(userQ, answerKeySection.questions);

        if (matchedQ) {
            const isAnswered = userQ.answer && userQ.answer.length > 0 && userQ.status === 'Answered';
            let marks = 0;
            let status = 'unattempted';

            if (isAnswered) {
                const userAnswerSet = new Set(userQ.answer.map(a => {
                    if (typeof a === 'number') {
                        return String.fromCharCode(64 + a).toUpperCase();
                    } else if (typeof a === 'string') {
                        // If it's already a letter, use it; if it's a number string, convert
                        const parsed = parseInt(a);
                        if (!isNaN(parsed)) {
                            return String.fromCharCode(64 + parsed).toUpperCase();
                        }
                        return a.trim().toUpperCase();
                    }
                    return '';
                }).filter(a => a)); // Remove empty strings
                const correctAnswerSet = new Set(
                    matchedQ.correct_answers.map(a => a.trim().toUpperCase())
                );


                const correctCount = [...userAnswerSet].filter(a => correctAnswerSet.has(a)).length;
                const incorrectCount = userAnswerSet.size - correctCount;
                const totalCorrect = correctAnswerSet.size;

                if (correctCount === totalCorrect && incorrectCount === 0) {
                    marks = answerKeySection.marks_scheme.full_marks;
                    status = 'correct';
                    result.correct_count++;
                } else if (incorrectCount > 0) {
                    marks = answerKeySection.marks_scheme.negative;
                    status = 'incorrect';
                    result.incorrect_count++;
                } else if (correctCount > 0) {
                    marks = answerKeySection.marks_scheme[`partial_${correctCount}`] || 0;
                    status = 'partial';
                    result.partial_count++;
                } else {
                    marks = 0;
                    status = 'incorrect';
                    result.incorrect_count++;
                }
            } else {
                result.unattempted_count++;
            }

            result.score += marks;
            result.questions.push({
                ...userQ,
                correct_answer: matchedQ.correct_answers,
                status: status,
                marks: marks,
                max_marks: answerKeySection.marks_scheme.full_marks
            });
        }
    });

    return result;
}

/**
 * Process MCQ Section
 */
function processMCQSection(userQuestions, answerKeySection) {
    const result = {
        name: 'Section 3 - MCQ',
        score: 0,
        correct_count: 0,
        incorrect_count: 0,
        unattempted_count: 0,
        total_questions: answerKeySection.total_questions,
        questions: []
    };

    userQuestions.forEach(userQ => {
        const matchedQ = findMatchingQuestion(userQ, answerKeySection.questions);

        if (matchedQ) {
            const isAnswered = userQ.answer !== null && userQ.status === 'Answered';
            let isCorrect = false;
            let marks = 0;

            if (isAnswered) {
                let userAnswer;

                if (typeof userQ.answer === 'number') {
                    userAnswer = String.fromCharCode(64 + userQ.answer).toUpperCase();
                } else if (typeof userQ.answer === 'string') {
                    const parsed = parseInt(userQ.answer);
                    if (!isNaN(parsed)) {
                        userAnswer = String.fromCharCode(64 + parsed).toUpperCase();
                    } else {
                        userAnswer = userQ.answer.trim().toUpperCase();
                    }
                }

                const correctAnswer = matchedQ.correct_answer.trim().toUpperCase();
                isCorrect = userAnswer === correctAnswer;

                marks = isCorrect ?
                    answerKeySection.marks_per_question :
                    answerKeySection.negative_marking;

                if (isCorrect) result.correct_count++;
                else result.incorrect_count++;
            } else {
                result.unattempted_count++;
            }

            result.score += marks;
            result.questions.push({
                ...userQ,
                correct_answer: matchedQ.correct_answer,
                is_correct: isCorrect,
                marks: marks,
                max_marks: answerKeySection.marks_per_question
            });
        }
    });

    return result;
}
