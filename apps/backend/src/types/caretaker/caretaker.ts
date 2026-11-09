export interface RegisterInput {
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
            caretaker?: {
                caretakerId: string;
            };
        }
    }
}

export { };
