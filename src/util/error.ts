type Issues = string[];

export class DomainErrror extends Error {
  private constructor(
    public message: string,
    public statusCode = 500,
    public issues?: Issues
  ) {
    super(message);
  }

  static BadRequest(issues: Issues): DomainErrror {
    return new DomainErrror("Bad input", 400, issues);
  }

  static Unauthorized(): DomainErrror {
    return new DomainErrror("Please login", 401);
  }

  static Forbidden(): DomainErrror {
    return new DomainErrror(
      "You don't have enough permissions to perform this action",
      403
    );
  }

  static NotFound(issues?: Issues): DomainErrror {
    return new DomainErrror(
      "The resource you requested does not exist",
      404,
      issues
    );
  }

  static UnprocessableEntity(issues?: Issues): DomainErrror {
    return new DomainErrror(
      "We are unable to process this request",
      422,
      issues
    );
  }

  static InternalError(issues: Issues): DomainErrror {
    return new DomainErrror("Something went wrong!", 500, issues);
  }

  static BadGateway(): DomainErrror {
    return new DomainErrror("Bad Gateway", 502);
  }
}
