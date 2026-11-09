export interface RegisterInput {
    name: string;
    email: string;
    password: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

declare global {
    namespace Express {
        interface Request {
            admin?: {
                adminId: string;
                role: string;
            };
        }
    }
}

export { };
