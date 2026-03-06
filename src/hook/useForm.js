import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

export const useForm = (initialValues, validationRules = {}) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked, files } = e.target;
        
        setValues(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
        }));

        // Marquer comme touché
        setTouched(prev => ({ ...prev, [name]: true }));

        // Valider en temps réel
        if (validationRules[name]) {
            validateField(name, value);
        }
    }, [validationRules]);

    const validateField = (name, value) => {
        const rule = validationRules[name];
        if (!rule) return;

        let error = '';
        
        if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
            error = rule.message || 'Ce champ est requis';
        } else if (rule.min && parseFloat(value) < rule.min) {
            error = rule.minMessage || `Minimum: ${rule.min}`;
        } else if (rule.max && parseFloat(value) > rule.max) {
            error = rule.maxMessage || `Maximum: ${rule.max}`;
        } else if (rule.pattern && !rule.pattern.test(value)) {
            error = rule.patternMessage || 'Format invalide';
        } else if (rule.validate) {
            error = rule.validate(value) || '';
        }

        setErrors(prev => ({ ...prev, [name]: error }));
        return !error;
    };

    const validateForm = useCallback(() => {
        const newErrors = {};
        let isValid = true;

        Object.keys(validationRules).forEach(name => {
            const rule = validationRules[name];
            const value = values[name];
            
            if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
                newErrors[name] = rule.message || 'Ce champ est requis';
                isValid = false;
            } else if (rule.min && parseFloat(value) < rule.min) {
                newErrors[name] = rule.minMessage || `Minimum: ${rule.min}`;
                isValid = false;
            } else if (rule.max && parseFloat(value) > rule.max) {
                newErrors[name] = rule.maxMessage || `Maximum: ${rule.max}`;
                isValid = false;
            } else if (rule.pattern && !rule.pattern.test(value)) {
                newErrors[name] = rule.patternMessage || 'Format invalide';
                isValid = false;
            } else if (rule.validate) {
                const error = rule.validate(value);
                if (error) {
                    newErrors[name] = error;
                    isValid = false;
                }
            }
        });

        setErrors(newErrors);
        return isValid;
    }, [values, validationRules]);

    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
    }, [initialValues]);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        setIsSubmitting,
        handleChange,
        validateForm,
        resetForm,
        setValues
    };
};