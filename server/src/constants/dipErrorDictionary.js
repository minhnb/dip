module.exports = {
    UNKNOWN_ERROR: {
        status: 500,
        code: "UNKNOWN_ERROR",
        details: "Unknown Error"
    },
    ACCESS_DENIED: {
        status: 403,
        code: "ACCESS_DENIED",
        details: "Access Denied"
    },
    BAD_REQUEST: {
        status: 400,
        code: "BAD_REQUEST",
        details: "Bad request"
    },
    INVALID_PASSWORD: {
        status: 400,
        code: "INVALID_PASSWORD",
        details: "Invalid password"
    },
    INVALID_USERNAME_OR_PASSWORD: {
        status: 400,
        code: "INVALID_USERNAME_OR_PASSWORD",
        details: "Invalid username or password"
    },
    UNAUTHORIZED: {
        status: 401,
        code: "UNAUTHORIZED",
        details: "Unauthorized"
    },
    MISSING_EMAIL: {
        status: 400,
        code: "MISSING_EMAIL",
        details: "Missing Email"
    },
    INVALID_INVITE_CODE: {
        status: 400,
        code: "INVALID_INVITE_CODE",
        details: "Invalid invite code"
    },
    EMAIL_EXISTED: {
        status: 409,
        code: "EMAIL_EXISTED",
        details: "Email existed"
    },
    INVALID_OR_EXPIRED_TOKEN: {
        status: 404,
        code: "INVALID_OR_EXPIRED_TOKEN",
        details: "Invalid or expired token"
    },
    USER_NOT_FOUND: {
        status: 404,
        code: "USER NOT FOUND",
        details: "User not found"
    },
    MISSING_EVENT: {
        status: 400,
        code: "MISSING_EVENT",
        details: "Missing event id"
    },
    MISSING_PRICE: {
        status: 400,
        code: "MISSING_PRICE",
        details: "Missing price"
    },
    INVALID_QUANTITIES: {
        status: 400,
        code: "INVALID_QUANTITIES",
        details: "Invalid quantities"
    },
    USER_ALREADY_JOIN_EVENT: {
        status: 400,
        code: "USER_ALREADY_JOIN_EVENT",
        details: "You already join this event"
    },
    UNMATCHED_EVENT_PRICE: {
        status: 400,
        code: "UNMATCHED_EVENT_PRICE",
        details: "Unmatched event price"
    },
    EVENT_OVERBOOKING: {
        status: 409,
        code: "EVENT_OVERBOOKING",
        details: "Overbooking"
    },
    INVALID_CARD_ID: {
        status: 400,
        code: "INVALID_CARD_ID",
        details: "Invalid card id"
    },
    CVC_CHECKING_FAILED: {
        status: 400,
        code: "CVC_CHECKING_FAILED",
        details: "CVC checking failed"
    },
    CARD_CHARGING_FAILED: {
        status: 402,
        code: "CARD_CHARGING_FAILED",
        details: "Card charging failed"
    },
    EVENT_NOT_FOUND: {
        status: 404,
        code: "EVENT_NOT_FOUND",
        details: "Event not found"
    },
    INVALID_SERVICES: {
        status: 400,
        code: "INVALID_SERVICES",
        details: "Invalid services"
    },
    MISSING_HOTEL_ID: {
        status: 400,
        code: "MISSING_HOTEL_ID",
        details: "Missing hotel id"
    },
    SERVICES_MUST_BE_AN_ARRAY: {
        status: 400,
        code: "SERVICES_MUST_BE_AN_ARRAY",
        details: "Services must be an array"
    },
    INVALID_OFFER_ID: {
        status: 400,
        code: "INVALID_OFFER_ID",
        details: "Invalid offer id"
    },
    MISSING_OFFER_DATE: {
        status: 400,
        code: "MISSING_OFFER_DATE",
        details: "Missing offer date"
    },
    OFFER_NOT_SERVE: {
        status: 400,
        code: "OFFER_NOT_SERVE",
        details: "Invalid offer date"
    },
    OFFER_OVERBOOKING: {
        status: 400,
        code: "OFFER_OVERBOOKING",
        details: "Overbooking"
    },
    UNMATCHED_OFFER_PRICE: {
        status: 400,
        code: "UNMATCHED_OFFER_PRICE",
        details: "Unmatched offer price"
    },
    INVALID_SPECIAL_OFFER: {
        status: 400,
        code: "INVALID_SPECIAL_OFFER",
        details: "Invalid special offer"
    },
    UNMATCHED_TOTAL_PRICE: {
        status: 400,
        code: "UNMATCHED_TOTAL_PRICE",
        details: "Unmatched total price"
    },
    OFFER_IS_REQUIRED: {
        status: 400,
        code: "OFFER_IS_REQUIRED",
        details: "Offer is required"
    },
    MISSING_OFFER_FIELD: {
        status: 400,
        code: "MISSING_OFFER_FIELD",
        details: "Missing offer field"
    },
    INVALID_OFFER_FIELD: {
        status: 400,
        code: "INVALID_OFFER_FIELD",
        details: "Invalid offer field"
    },
    INVALID_OFFER_COUNT: {
        status: 400,
        code: "INVALID_OFFER_COUNT",
        details: "Invalid offer count"
    },
    MISSING_OFFER_ID: {
        status: 400,
        code: "MISSING_OFFER_ID",
        details: "Missing offer id"
    },
    HOTEL_NOT_FOUND: {
        status: 404,
        code: "HOTEL_NOT_FOUND",
        details: "Hotel not found"
    },
    SERVICE_NOT_FOUND: {
        status: 404,
        code: "SERVICE_NOT_FOUND",
        details: "Service not found"
    },
    OFFER_NOT_FOUND: {
        status: 404,
        code: "OFFER_NOT_FOUND",
        details: "Offer not found"
    },
    NOT_SUPPORT: {
        status: 404,
        code: "NOT_SUPPORT",
        details: "Not Support"
    },
    MISSING_USER_ID_AND_EMAIL: {
        status: 400,
        code: "MISSING_USER_ID_AND_EMAIL",
        details: "Missing user id and email"
    },
    CANT_ADD_YOURSELF: {
        status: 400,
        code: "CANT_ADD_YOURSELF",
        details: "Can't add yourself as a friend"
    },
    WRONG_PASSWORD: {
        status: 400,
        code: "WRONG_PASSWORD",
        details: "Wrong password"
    },
    NO_IMAGE_SPECIFIED: {
        status: 400,
        code: "NO_IMAGE_SPECIFIED",
        details: "No image specified"
    },
    S3_ERROR: {
        status: 500,
        code: "S3_ERROR",
        details: "S3 Error"
    },
    NEED_CANCEL_CURRENT_SUBSCRIPTION: {
        status: 400,
        code: "NEED_CANCEL_CURRENT_SUBSCRIPTION",
        details: "Need cancel current subscription"
    },
    NO_CREDIT_CARD: {
        status: 400,
        code: "NO_CREDIT_CARD",
        details: "You do not have any credit card"
    },
    PLAN_NOT_FOUND: {
        status: 404,
        code: "PLAN_NOT_FOUND",
        details: "Plan not found"
    },
    INVALID_MEMBERSHIP: {
        status: 400,
        code: "INVALID_MEMBERSHIP",
        details: "Invalid membership"
    },
    CARD_EXISTED: {
        status: 400,
        code: "CARD_EXISTED",
        details: "Card existed"
    },
    INVALID_PROMOTION_CODE: {
        status: 404,
        code: "INVALID_PROMOTION_CODE",
        details: "Invalid promotion code"
    },
    PROMOTION_CODE_ALREADY_USED: {
        status: 400,
        code: "PROMOTION_CODE_ALREADY_USED",
        details: "Promotion code already used"
    },
    GEO_ERROR: {
        status: 400,
        code: "GEO_ERROR",
        details: "Geo error"
    },
    MEMBERS_MUST_BE_ARRAY: {
        status: 400,
        code: "MEMBERS_MUST_BE_ARRAY",
        details: "Members must be an array"
    },
    INVALID_MEMBER_ID: {
        status: 400,
        code: "INVALID_MEMBER_ID",
        details: "Invalid member id"
    },
    MISSING_LAST_MESSAGE: {
        status: 400,
        code: "MISSING_LAST_MESSAGE",
        details: "Missing last message"
    },
    INVALID_RATING: {
        status: 400,
        code: "INVALID RATING",
        details: "Invalid rating"
    },
    INVALID_MEMBERS: {
        status: 400,
        code: "INVALID_MEMBERS",
        details: "Invalid members"
    },
    MISSING_MEMBERS: {
        status: 400,
        code: "MISSING_MEMBERS",
        details: "Missing members"
    },
    GROUP_NOT_FOUND: {
        status: 404,
        code: "GROUP_NOT_FOUND",
        details: "Group not found"
    },
    CANT_REMOVE_YOURSELF: {
        status: 400,
        code: "CANT_REMOVE_YOURSELF",
        details: "Couldn't remove yourself"
    },
    MEMBERSHIP_TYPE_NOT_FOUND: {
        status: 404,
        code: "MEMBERSHIP_TYPE_NOT_FOUND",
        details: "Membership type not found"
    },
    STRIPE_CARD_DECLINED: {
        status: 400,
        code: "STRIPE_CARD_DECLINED",
        details: "Your card was declined"
    },
    STRIPE_INCORRECT_CVC: {
        status: 400,
        code: "STRIPE_INCORRECT_CVC",
        details: "Your card's security code is incorrect"
    },
    STRIPE_PROCESSING_ERROR: {
        status: 400,
        code: "STRIPE_PROCESSING_ERROR",
        details: "An error occurred while processing your card. Try again in a little bit"
    },
    STRIPE_EXPIRED_CARD: {
        status: 400,
        code: "STRIPE_EXPIRED_CARD",
        details: "Your card has expired"
    },
    STRIPE_INVALID_TOKEN: {
        status: 400,
        code: "STRIPE_INVALID_TOKEN",
        details: "Invalid stripe token"
    },
    HOTEL_INVALID_NAME: {
        status: 400,
        code: "HOTEL_INVALID_NAME",
        details: "Invalid hotel name"
    },
    HOTEL_INVALID_ADDRESS: {
        status: 400,
        code: "HOTEL_INVALID_ADDRESS",
        details: "Invalid full address"
    },
    HOTEL_ADDRESS_NOT_FOUND: {
        status: 404,
        code: "HOTEL_ADDRESS_NOT_FOUND",
        details: "Address not found"
    },
    HOTEL_NEED_LOCATION_BEFORE_APPROVE: {
        status: 400,
        code: "HOTEL_NEED_LOCATION_BEFORE_APPROVE",
        details: "Please set location for hotel before approve"
    },
    HOTEL_CAN_NOT_SUBMIT_APPROVED_OR_PENDING_HOTEL: {
        status: 400,
        code: "HOTEL_CAN_NOT_SUBMIT_APPROVED_OR_PENDING_HOTEL",
        details: "Can not submit approved or pending hotel"
    },
    HOTEL_IS_NOT_PENDING_HOTEL: {
        status: 400,
        code: "HOTEL_IS_NOT_PENDING_HOTEL",
        details: "It's not pending hotel"
    },
    HOTEL_STATUS_MUST_BE_APPROVED_OR_DECLINED: {
        status: 400,
        code: "HOTEL_STATUS_MUST_BE_APPROVED_OR_DECLINED",
        details: "Status must be Approved or Declined"
    },
    HOTEL_NEED_FAIL_REASON: {
        status: 400,
        code: "HOTEL_NEED_FAIL_REASON",
        details: "Please provide a reason for declining this hotel"
    },
    HOTEL_ALREADY_APPROVED: {
        status: 400,
        code: "HOTEL_ALREADY_APPROVED",
        details: "Hotel is already approved"
    },
    HOTEL_INVALID_STATUS: {
        status: 400,
        code: "HOTEL_INVALID_STATUS",
        details: "Invalid hotel status"
    },
    PASS_NOT_FOUND: {
        status: 404,
        code: "PASS_NOT_FOUND",
        details: "Pass not found"
    },
    CANNOT_CHANGE_PENDING_HOTEL: {
        status: 400,
        code: 'CANNOT_CHANGE_PENDING_HOTEL',
        details: 'Cannot change pending hotel'
    }
};