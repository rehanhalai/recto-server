export const asyncHandler =
  (fn: Function) => async (req: Request, res: Response, next: Function) => {
    try {
      await fn(req, res, next);
    } catch (error : unknown) {
        next(error); // Pass the error to the next middleware
    }
  };
