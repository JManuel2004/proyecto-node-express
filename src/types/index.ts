import { Request } from 'express';

export type ProjectStatus = 'active' | 'archived' | 'completed';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface IUser {
  _id?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'superadmin' | 'usuario';
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProject {
  _id?: string;
  name: string;
  description?: string;
  owner: IUser['_id']; 
  status?: ProjectStatus;
  startDate: Date;
  endDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITask {
  _id?: string;  
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: Date;
  project: IProject['_id']; 
  assignedTo?: IUser['_id']; 
  createdAt?: Date;
  updatedAt?: Date;
}


export interface JWTPayload {
  userId: string;
  email: string;
  role: 'superadmin' | 'usuario';
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'superadmin' | 'usuario';
  isActive?: boolean;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  deadline: Date;
  project: string;
  assignedTo?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  deadline?: Date;
  assignedTo?: string;
}