// Question Matching Module

/**
 * Calculate Levenshtein distance between two strings
 */
function calculateSimilarity(str1, str2) {
    str1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
    str2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];
    
    for (let i = 0; i <= len2; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= len1; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len2; i++) {
        for (let j = 1; j <= len1; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : 1 - distance / maxLen;
}

/**
 * Find matching question in answer key
 */
function findMatchingQuestion(userQuestion, answerKeyQuestions) {
    let bestMatch = null;
    let highestSimilarity = 0;
    
    for (const akQuestion of answerKeyQuestions) {
        const similarity = calculateSimilarity(
            userQuestion.question_text,
            akQuestion.question_text
        );
        
        if (similarity > highestSimilarity && similarity > CONFIG.SIMILARITY_THRESHOLD) {
            highestSimilarity = similarity;
            bestMatch = akQuestion;
        }
    }
    
    return bestMatch;
}
