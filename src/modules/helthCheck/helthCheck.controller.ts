import type { Request, Response } from "express";
import ApiResponse from "../../common/utils/api.response.ts";

const healthCheck = async (req: Request, res: Response) => {
    ApiResponse.ok(res, "Health Check", {});
}

export default healthCheck