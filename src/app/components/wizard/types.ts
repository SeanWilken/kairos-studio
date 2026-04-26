export interface UserRegistrationState {
    
  user_email: string;
  user_password: string;
  user_role: string;
  user_first_name: string;
  user_last_name: string;
  user_tenant_id?: string;
  user_org_id?: string;
  user_department?: string;
  user_phone?: string;
  is_global_admin?: boolean;
  
  user_nickname?: string;
  user_title?: string;

  // personality_traits: string[];
  // work_preferences: string[];
  // strengths: string[];
  // weaknesses: string[];
  // areas_for_growth: string[];
  // areas_of_expertise: string[];
  // interests: string[];
  
  confirmed: boolean;

}

export interface UserStepProps {
  state: UserRegistrationState;
  update: (partial: Partial<UserRegistrationState>) => void;
}











