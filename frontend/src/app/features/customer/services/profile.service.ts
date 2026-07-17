import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api.model';
import { User } from '../../../core/models/user.model';

export interface Address {
  id: string;
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface ProfileUpdateRequest {
  name?: string;
  phone?: string;
  communicationPreferences?: CommunicationPreferences;
}

export interface CommunicationPreferences {
  emailMarketing: boolean;
  orderUpdates: boolean;
  supportNotifications: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/profile`;

  getProfile(): Observable<ApiResponse<User & { phone?: string; communicationPreferences?: CommunicationPreferences }>> {
    return this.http.get<ApiResponse<User & { phone?: string; communicationPreferences?: CommunicationPreferences }>>(this.base);
  }

  updateProfile(payload: ProfileUpdateRequest): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(this.base, payload);
  }

  changePassword(payload: ChangePasswordRequest): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.base}/change-password`, payload);
  }

  getAddresses(): Observable<ApiResponse<Address[]>> {
    return this.http.get<ApiResponse<Address[]>>(`${this.base}/addresses`);
  }

  addAddress(address: Omit<Address, 'id'>): Observable<ApiResponse<Address>> {
    return this.http.post<ApiResponse<Address>>(`${this.base}/addresses`, address);
  }

  updateAddress(id: string, address: Partial<Address>): Observable<ApiResponse<Address>> {
    return this.http.patch<ApiResponse<Address>>(`${this.base}/addresses/${id}`, address);
  }

  deleteAddress(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/addresses/${id}`);
  }
}
