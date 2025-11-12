// modules/categoryConfig.js - Category and subcategory configuration

export const CATEGORY_CONFIG = {
    f1arti: {
        name: 'F1 Articles',
        subcategories: ['2025 Season', 'General']
    },
    movietv: {
        name: 'Movie/TV',
        subcategories: ['Movies', 'TV Shows']
    },
    experience: {
        name: 'Experience',
        subcategories: []
    },
    techart: {
        name: 'Tech Articles',
        subcategories: []
    }
};

export const SECONDARY_CATEGORY_CONFIG = {
    f1: {
        name: 'F1',
        subcategories: ['General', 'Race Analysis', 'News']
    }
};

// Get all unique subcategories from primary categories
export function getAllSubcategories() {
    const allSubcategories = [];
    
    Object.values(CATEGORY_CONFIG).forEach(category => {
        if (Array.isArray(category.subcategories)) {
            category.subcategories.forEach(subcat => {
                if (!allSubcategories.includes(subcat)) {
                    allSubcategories.push(subcat);
                }
            });
        }
    });
    
    return allSubcategories;
}

// Get all secondary categories
export function getAllSecondaryCategories() {
    return Object.keys(SECONDARY_CATEGORY_CONFIG);
}

// Get all unique secondary subcategories
export function getAllSecondarySubcategories() {
    const allSubcategories = [];
    
    Object.values(SECONDARY_CATEGORY_CONFIG).forEach(category => {
        if (Array.isArray(category.subcategories)) {
            category.subcategories.forEach(subcat => {
                if (!allSubcategories.includes(subcat)) {
                    allSubcategories.push(subcat);
                }
            });
        }
    });
    
    return allSubcategories;
}
