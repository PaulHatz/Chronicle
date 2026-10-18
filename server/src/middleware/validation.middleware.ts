import type { RequestHandler, ErrorRequestHandler } from "express";
import { z } from "zod";

const emptyBody = z.object({}).strict().optional();
const params = z.record(z.string(), z.string().regex(/^[1-9]\d*$/).refine(
    value => Number(value) <= 2147483647, "ID is outside the supported range."));
const query = z.object({}).strict(); // No current API endpoints accept query parameters.

export function validateRequest(body: z.ZodType = emptyBody): RequestHandler {
    return (req, res, next) => {
        if (req.body !== undefined && req.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
            return res.status(415).json({message:"Content-Type must be application/json."});
        }
        const results = [
            {source:"params", result:params.safeParse(req.params)},
            {source:"query", result:query.safeParse(req.query)},
            {source:"body", result:body.safeParse(req.body)},
        ];
        const errors = results.flatMap(({source,result}) => result.success ? [] : result.error.issues.map(issue => ({
            field:[source,...issue.path].join("."), message:issue.code === "unrecognized_keys" ? "Unexpected fields." : issue.message,
        })));
        if (errors.length) return res.status(400).json({message:"Invalid request.",errors:errors.slice(0,25)});
        // Controllers receive only the validated, normalized body. Express query is read-only.
        req.body = results[2].result.data;
        return next();
    };
}

export const requestErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
    if (error?.type === "entity.parse.failed") return res.status(400).json({message:"Malformed JSON body."});
    if (error?.type === "entity.too.large") return res.status(413).json({message:"Request body exceeds the 100 KB limit."});
    if (["charset.unsupported","encoding.unsupported"].includes(error?.type)) {
        return res.status(415).json({message:"Unsupported request encoding."});
    }
    if (error instanceof URIError || error?.type === "request.size.invalid" || error?.type === "request.aborted") {
        return res.status(400).json({message:"Malformed request."});
    }
    return next(error);
};

// Check the transport before auth or routes, including bodies Express would otherwise ignore.
export const requireJson: RequestHandler = (req,res,next) => {
    const hasBody = req.headers["transfer-encoding"] !== undefined || Number(req.headers["content-length"] ?? 0) > 0;
    if (hasBody && !req.is("application/json")) return res.status(415).json({message:"Content-Type must be application/json."});
    next();
};
