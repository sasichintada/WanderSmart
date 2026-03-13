namespace wanderSmart.Backend.Models.Enums;

public enum UserRole
{
    User,
    Admin,
    TravelAgent
}

public enum ActivityType
{
    Login,
    Logout,
    CreateItinerary,
    UpdateItinerary,
    DeleteItinerary,
    ViewItinerary,
    BookActivity,
    CancelBooking,
    AddReview,
    UpdateProfile,
    ChangePassword
}

public enum TravelStyle
{
    Luxury,
    Budget,
    Adventure,
    Cultural,
    Relaxation,
    Business,
    Family
}

public enum ActivityCategory
{
    Sightseeing,
    Dining,
    Adventure,
    Shopping,
    Entertainment,
    Relaxation,
    Cultural,
    Sports
}

public enum BudgetLevel
{
    Low,
    Medium,
    High,
    Luxury
}