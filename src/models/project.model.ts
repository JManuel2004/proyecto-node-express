import { Schema, Document, model } from "mongoose";
import { IUser } from "../types";

export type ProjectStatus = 'active' | 'archived' | 'completed';

export interface ProjectInput {
    name: string;
    description?: string;
    owner: IUser['_id'];
    status?: ProjectStatus;
    startDate: Date;
    endDate?: Date;
}

export interface ProjectDocument extends ProjectInput, Document {}

const projectSchema = new Schema<ProjectDocument>({
    name: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: 100
    },
    description: { 
        type: String,
        trim: true,
        maxlength: 500
    },
    owner: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['active', 'archived', 'completed'],
        default: 'active'
    },
    startDate: { 
        type: Date, 
        required: true 
    },
    endDate: { 
        type: Date 
    }
}, {
    timestamps: true 
});

projectSchema.index({ owner: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ startDate: 1 });

projectSchema.pre('save', function(next) {
    if (this.endDate && this.startDate > this.endDate) {
        next(new Error('La fecha de inicio no puede ser posterior a la fecha de fin'));
    }
    next();
});

export const ProjectModel = model<ProjectDocument>("Project", projectSchema);