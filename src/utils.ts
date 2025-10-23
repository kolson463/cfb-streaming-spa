

export type Game = {
    homeApRank: any;
    homeCoachesRank: any;
    awayApRank: any;
    awayCoachesRank: any;
    state: any;
    countryCode: any;
    city: any;
    notes: any;
    highlights: any;
    conferenceGame: any;
    neutralSite: any;
    venue: any;
    awayLineScores: any;
    homeLineScores: any;
    awayConference: Element;
    homeConference: Element;
    startDate: string; // Changed to string based on how it's used in JSON, but will be parsed/formatted.
    season: number;
    seasonType: string;
    week: number;
    homeId: number;
    homeTeam: string;
    homePoints: number;
    awayId: number;
    awayTeam: string;
    awayPoints: number;
    winner_id: number;
    total_week: number;
};

export type RowGame = {
    winner_id: number;
    teamName: string;
    logoUrl: string;
    total_week: number;
    seasonType: string;
};

export const scrollSpeeds = [
    { key: ".5x", value: 4 },
    { key: "Normal", value: 2 },
    { key: "2x", value: 1 },
    { key: "4x", value: 0.5 },
];

export const stateToTimeZone: Record<string, string> = {
    AL: "America/Chicago",
    AK: "America/Anchorage",
    AZ: "America/Phoenix",
    CA: "America/Los_Angeles",
    CO: "America/Denver",
    CT: "America/New_York",
    DC: "America/New_York",
    DE: "America/New_York",
    FL: "America/New_York",
    GA: "America/New_York",
    HI: "Pacific/Honolulu",
    IA: "America/Chicago",
    ID: "America/Boise", // or split
    IL: "America/Chicago",
    IN: "America/Indiana/Indianapolis",
    KS: "America/Chicago",
    KY: "America/New_York",
    LA: "America/Chicago",
    MA: "America/New_York",
    MD: "America/New_York",
    ME: "America/New_York",
    MI: "America/Detroit",
    MN: "America/Chicago",
    MO: "America/Chicago",
    MS: "America/Chicago",
    MT: "America/Denver",
    NC: "America/New_York",
    ND: "America/Chicago",
    NE: "America/Chicago",
    NH: "America/New_York",
    NJ: "America/New_York",
    NM: "America/Denver",
    NV: "America/Los_Angeles",
    NY: "America/New_York",
    OH: "America/New_York",
    OK: "America/Chicago",
    OR: "America/Los_Angeles",
    PA: "America/New_York",
    RI: "America/New_York",
    SC: "America/New_York",
    SD: "America/Chicago",
    TN: "America/Chicago",
    TX: "America/Chicago",
    UT: "America/Denver",
    VA: "America/New_York",
    VT: "America/New_York",
    WA: "America/Los_Angeles",
    WI: "America/Chicago",
    WV: "America/New_York",
    WY: "America/Denver",
};
