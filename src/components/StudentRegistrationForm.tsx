import React, { useState, useEffect } from 'react';

interface StudentRegistrationFormProps {
  event: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading: boolean;
  user: any; // Add user prop for auto-filled information
}

const StudentRegistrationForm: React.FC<StudentRegistrationFormProps> = ({ 
  event, 
  onClose, 
  onSubmit,
  loading,
  user
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-filled student information (only name, semester, department)
  const studentInfo = {
    name: user.username,
    department: user.department,
    semester: user.semester
  };

  useEffect(() => {
    // Initialize form data with empty values for each field
    const initialData: Record<string, string> = {};
    if (event.registrationFields) {
      event.registrationFields.forEach((field: string) => {
        initialData[field] = '';
      });
    }
    setFormData(initialData);
  }, [event]);

  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(formData).forEach(field => {
      // Skip validation for auto-filled student info fields
      const lowerField = field.toLowerCase();
      if (['name', 'student name', 'department', 'semester'].includes(lowerField)) {
        return;
      }
      
      if (!formData[field].trim()) {
        newErrors[field] = `${field} is required`;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Include auto-filled student information in the submission
      onSubmit({
        ...formData,
        studentName: studentInfo.name,
        department: studentInfo.department,
        semester: studentInfo.semester
      });
    }
  };

  if (!event.registrationFields) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>No Registration Form Available</h3>
          <p>This event does not have a registration form configured.</p>
          <button onClick={onClose} className="cancel-btn">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Register for "{event.title}"</h3>
        <p>Please fill in all the required information below:</p>
        
        <form onSubmit={handleSubmit}>
          {/* Auto-filled student information - READONLY */}
          <div className="form-group">
            <label htmlFor="studentName">Name:</label>
            <input
              type="text"
              id="studentName"
              value={studentInfo.name}
              readOnly
              className="readonly-field"
            />
            {/* Hidden input to include in form data */}
            <input
              type="hidden"
              name="studentName"
              value={studentInfo.name}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="department">Department:</label>
            <input
              type="text"
              id="department"
              value={studentInfo.department}
              readOnly
              className="readonly-field"
            />
            {/* Hidden input to include in form data */}
            <input
              type="hidden"
              name="department"
              value={studentInfo.department}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="semester">Semester:</label>
            <input
              type="text"
              id="semester"
              value={studentInfo.semester}
              readOnly
              className="readonly-field"
            />
            {/* Hidden input to include in form data */}
            <input
              type="hidden"
              name="semester"
              value={studentInfo.semester}
            />
          </div>
          
          {/* Event registration fields - only validate these */}
          {event.registrationFields.map((field: string, index: number) => {
            // Skip displaying auto-filled fields since they're already shown above
            const lowerField = field.toLowerCase();
            if (['name', 'student name', 'department', 'semester'].includes(lowerField)) {
              return null;
            }
            
            return (
              <div key={index} className="form-group">
                <label htmlFor={field}>{field}:</label>
                <input
                  type={field.toLowerCase().includes('email') ? 'email' : 'text'}
                  id={field}
                  value={formData[field] || ''}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className={errors[field] ? 'error' : ''}
                />
                {errors[field] && <span className="error-text">{errors[field]}</span>}
              </div>
            );
          })}
          
          <div className="modal-actions">
            <button type="submit" disabled={loading} className="save-btn">
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentRegistrationForm;