class BaseService {
   constructor(dependencies = {}) {
      this.dependencies = dependencies;
  }

    getDependency(key) {
    const dependency = this.dependencies[key];
     if (!dependency) {
        throw new Error(`Dependency '${key}' not found`);
    }
     return dependency;
    }

   handleError(error, context = 'Service operation') {
      const message = error.message || 'An unknown error occurred';
    throw new Error(`${context}: ${message}`);
   }

  validateRequired(data, requiredFields) {
     const missing = requiredFields.filter(field => !data[field]);
      if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
     }
    }

   paginate(items, page = 1, limit = 10) {
      const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
     const skip = (pageNum - 1) * limitNum;
      const total = items.length;
    const pages = Math.ceil(total / limitNum);

      return {
      items: items.slice(skip, skip + limitNum),
       pagination: {
          page: pageNum,
        limit: limitNum,
         total,
          pages,
        hasNext: pageNum < pages,
         hasPrev: pageNum > 1
        }
    };
   }

  sort(items, field, order = 'asc') {
     return [...items].sort((a, b) => {
        const aVal = a[field];
      const bVal = b[field];

        if (aVal === bVal) return 0;

       const comparison = aVal > bVal ? 1 : -1;
        return order === 'desc' ? -comparison : comparison;
    });
   }
}

module.exports = BaseService;
