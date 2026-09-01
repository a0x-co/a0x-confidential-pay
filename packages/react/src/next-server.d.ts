declare module "next/server" {
  export interface NextRequest extends Request {}
  export class NextResponse extends Response {
    constructor(body?: BodyInit | null, init?: ResponseInit);
    static json(body: any, init?: ResponseInit): NextResponse;
  }
}