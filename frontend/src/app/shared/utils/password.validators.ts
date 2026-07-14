import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates that a password satisfies strength requirements:
 *  - At least 8 characters
 *  - At least one uppercase letter
 *  - At least one lowercase letter
 *  - At least one digit
 *  - At least one special character
 */
export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value ?? '';
    if (!value) return null; // let required handle empty

    const errors: ValidationErrors = {};
    if (value.length < 8) errors['minLength'] = true;
    if (!/[A-Z]/.test(value)) errors['uppercase'] = true;
    if (!/[a-z]/.test(value)) errors['lowercase'] = true;
    if (!/[0-9]/.test(value)) errors['digit'] = true;
    if (!/[^A-Za-z0-9]/.test(value)) errors['specialChar'] = true;

    return Object.keys(errors).length ? { passwordStrength: errors } : null;
  };
}

/**
 * Cross-field validator that checks two password controls match.
 * Apply to the FormGroup that contains both controls.
 */
export function passwordMatchValidator(
  passwordField = 'password',
  confirmField = 'confirmPassword'
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pass = group.get(passwordField)?.value;
    const confirm = group.get(confirmField)?.value;
    if (pass && confirm && pass !== confirm) {
      return { passwordMismatch: true };
    }
    return null;
  };
}
