export interface GoogleTokens {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
    token_type: string;
    id_token?: string;
  }
  
  export interface GoogleUser {
    id: string;
    email: string;
    name: string;
    picture: string;
    verified_email: boolean;
  }
  
  export interface BackendResponse {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      avatar?: string;
    };
  }
  
  export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
  }