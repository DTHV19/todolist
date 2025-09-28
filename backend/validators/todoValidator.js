// Validation Layer - Kiểm tra tính hợp lệ của dữ liệu

class TodoValidator {
  // Validate dữ liệu todo
  validateTodoData(data, isUpdate = false) {
    const errors = [];

    // Nếu là update và chỉ có completed field thì skip validation khác
    if (isUpdate && Object.keys(data).length === 1 && data.completed !== undefined) {
      // Chỉ validate completed
      if (typeof data.completed !== 'boolean') {
        errors.push('Trạng thái hoàn thành phải là true hoặc false');
      }
      return errors;
    }

    // Kiểm tra tiêu đề - chỉ bắt buộc khi tạo mới hoặc khi có trong update
    if (!isUpdate) {
      // Khi tạo mới - title bắt buộc
      if (!data.title || typeof data.title !== 'string') {
        errors.push('Tiêu đề là bắt buộc và phải là chuỗi');
      } else {
        if (data.title.trim() === '') {
          errors.push('Tiêu đề không được để trống');
        }
        if (data.title.length > 200) {
          errors.push('Tiêu đề không được quá 200 ký tự');
        }
      }
    } else {
      // Khi update - chỉ validate title nếu có trong data
      if (data.title !== undefined) {
        if (!data.title || typeof data.title !== 'string') {
          errors.push('Tiêu đề phải là chuỗi');
        } else {
          if (data.title.trim() === '') {
            errors.push('Tiêu đề không được để trống');
          }
          if (data.title.length > 200) {
            errors.push('Tiêu đề không được quá 200 ký tự');
          }
        }
      }
    }

    // Kiểm tra mô tả - chỉ khi có trong data
    if (data.description !== undefined) {
      if (typeof data.description !== 'string') {
        errors.push('Mô tả phải là chuỗi');
      } else if (data.description.length > 1000) {
        errors.push('Mô tả không được quá 1000 ký tự');
      }
    }

    // Kiểm tra priority - chỉ khi có trong data
    if (data.priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(data.priority.toLowerCase())) {
        errors.push('Mức độ ưu tiên phải là: low, medium, hoặc high');
      }
    }

    // Kiểm tra ngày hết hạn - chỉ khi có trong data
    if (data.dueDate !== undefined) {
      if (data.dueDate && data.dueDate !== '') {
        const dueDate = new Date(data.dueDate);
        if (isNaN(dueDate.getTime())) {
          errors.push('Ngày hết hạn không hợp lệ');
        }
      }
    }

    // Kiểm tra trạng thái hoàn thành - chỉ khi có trong data
    if (data.completed !== undefined && typeof data.completed !== 'boolean') {
      errors.push('Trạng thái hoàn thành phải là true hoặc false');
    }

    return errors;
  }

  // Validate file upload
  validateFileUpload(file) {
    const errors = [];

    if (!file) {
      errors.push('Không có file được tải lên');
      return errors;
    }

    // Kiểm tra định dạng file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)');
    }

    // Kiểm tra kích thước file (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('File ảnh quá lớn. Kích thước tối đa là 5MB');
    }

    return errors;
  }

  // Validate pagination
  validatePagination(page, limit) {
    const errors = [];

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Số trang phải là số nguyên dương');
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push('Số lượng items phải từ 1 đến 100');
    }

    return errors;
  }

  // Validate ID
  validateId(id) {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return ['ID không hợp lệ'];
    }
    return [];
  }

  // Validate import file
  validateImportFile(file) {
    const errors = [];

    if (!file) {
      errors.push('Không có file được tải lên');
      return errors;
    }

    if (!file.originalname.toLowerCase().endsWith('.json')) {
      errors.push('Chỉ chấp nhận file định dạng JSON');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.push('File quá lớn. Kích thước tối đa là 10MB');
    }

    return errors;
  }

  // Sanitize input để tránh XSS
  sanitizeInput(data) {
    if (typeof data === 'string') {
      return data.trim().replace(/[<>]/g, '');
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return data;
  }
}

module.exports = new TodoValidator();
