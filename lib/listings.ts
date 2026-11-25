import type { Listing, PropertyType } from "@/lib/types";

type Row = [
  id: string,
  address: string,
  neighborhood: string,
  city: string,
  zip: string,
  price: number,
  beds: number,
  baths: number,
  sqft: number,
  type: PropertyType,
  year: number,
  hoa: number,
  dom: number,
  description: string,
  highlights: [string, string, string],
  openHouse?: string,
];

const ROWS: Row[] = [
  ["SR-2401", "3125 Tejon St #4", "Highlands", "Denver", "80211", 629000, 3, 2, 1488, "condo", 2006, 285, 11, "A top-floor condo on Tejon with a west deck and a reserved garage stall. The building is a short walk to Highlands Square.", ["West deck", "Garage stall", "Top floor"], "Sat 11:00 AM–1:00 PM"],
  ["SR-2402", "3418 Navajo St", "Highlands", "Denver", "80211", 639500, 3, 2.5, 1620, "townhome", 2014, 95, 6, "End-unit townhome with a ground-floor bedroom and a roof deck toward the skyline. Alley garage fits one car.", ["Roof deck", "Alley garage", "Ground-floor bedroom"]],
  ["SR-2403", "2840 Boulder St #2", "Highlands", "Denver", "80211", 599000, 3, 2, 1395, "condo", 1998, 310, 18, "Garden-level three-bedroom in a small brick building, updated kitchen, shared courtyard. Lowest Highlands three-bedroom in this catalog.", ["Updated kitchen", "Courtyard", "Storage unit"]],
  ["SR-2404", "3622 Vallejo St", "Highlands", "Denver", "80211", 875000, 3, 2.5, 1980, "house", 1912, 0, 4, "Brick Denver square with a finished basement and a new roof in 2022. Over the $650k line, kept here so a budget filter can exclude it.", ["Finished basement", "New roof", "Two-car garage"]],
  ["SR-2405", "2911 W 32nd Ave #6", "Highlands", "Denver", "80211", 715000, 2, 2, 1210, "condo", 2019, 340, 9, "Two-bedroom corner condo with a balcony over 32nd. Useful when a three-bedroom search should leave it out.", ["Corner unit", "Balcony", "Elevator"]],
  ["SR-2410", "1644 Boulder St #301", "LoHi", "Denver", "80211", 689000, 2, 2, 1180, "condo", 2016, 420, 14, "LoHi condo a few blocks from the pedestrian bridge. Two bedrooms, one parking space, and a balcony.", ["Balcony", "Assigned parking", "Near the bridge"]],
  ["SR-2411", "1735 Central St", "LoHi", "Denver", "80211", 925000, 3, 3, 1760, "townhome", 2018, 80, 7, "Three-story townhome with a roof deck and a two-car tandem garage. List price sits well above a $650k cap.", ["Roof deck", "Tandem garage", "Primary on the second floor"]],
  ["SR-2420", "4480 Yates St", "Berkeley", "Denver", "80212", 615000, 3, 2, 1540, "house", 1924, 0, 21, "Bungalow on Yates with a front porch and an unfinished basement that is still legal ceiling height. One-car detached garage.", ["Front porch", "Detached garage", "Unfinished basement"]],
  ["SR-2421", "4722 Tennyson St #B", "Berkeley", "Denver", "80212", 549000, 2, 2, 1088, "condo", 2004, 260, 12, "Side-by-side duplex condo just off Tennyson. Two bedrooms upstairs, a small yard off the kitchen.", ["Small yard", "Off-street parking", "Updated bath"]],
  ["SR-2422", "4316 Sheridan Blvd", "Berkeley", "Denver", "80212", 589000, 4, 2, 1710, "house", 1952, 0, 16, "Four-bedroom house on Sheridan with a large lot and an older kitchen. A three-bedroom filter leaves it out.", ["Large lot", "Four bedrooms", "One-car garage"]],
  ["SR-2430", "2215 Meade St", "Sloan's Lake", "Denver", "80212", 675000, 3, 2, 1688, "house", 1908, 0, 8, "Bungalow two blocks east of the lake path. Updated electrical, original trim, and a single garage on the alley.", ["Near the lake path", "Updated electrical", "Alley garage"]],
  ["SR-2431", "1988 Wolff St", "Sloan's Lake", "Denver", "80212", 799000, 4, 3, 2140, "house", 2015, 0, 5, "Newer four-bedroom with a rooftop stair and a two-car garage. The lake is a short walk west.", ["Two-car garage", "Roof access", "Four bedrooms"]],
  ["SR-2440", "3340 Walnut St #520", "RiNo", "Denver", "80205", 575000, 2, 2, 1024, "condo", 2017, 390, 19, "Fifth-floor condo on Walnut with a balcony toward the railyard. One deeded parking space in the garage.", ["Deeded parking", "Balcony", "Concrete floors"]],
  ["SR-2441", "3501 Larimer St #12", "RiNo", "Denver", "80205", 640000, 3, 2, 1410, "condo", 2009, 355, 10, "Three-bedroom warehouse conversion with a den that is a legal bedroom. HOA allows one pet.", ["Warehouse conversion", "One pet", "In-unit laundry"]],
  ["SR-2450", "2736 Curtis St", "Five Points", "Denver", "80205", 525000, 3, 2, 1320, "townhome", 2001, 140, 15, "Townhome on Curtis with a one-car garage and a small patio. Three bedrooms, two of them upstairs.", ["One-car garage", "Patio", "In-unit laundry"]],
  ["SR-2451", "2901 Arapahoe St #8", "Five Points", "Denver", "80205", 449000, 2, 1, 890, "condo", 1968, 295, 27, "One-bath condo in a brick walk-up. The price is the catalog's lowest two-bedroom near downtown.", ["Walk-up", "Updated bath", "Storage"]],
  ["SR-2460", "1030 N Corona St #6", "Capitol Hill", "Denver", "80203", 415000, 2, 1, 860, "condo", 1920, 320, 22, "Second-floor condo in a Capitol Hill mansion conversion. Shared laundry, no parking, tall windows.", ["Tall windows", "Shared laundry", "No parking"]],
  ["SR-2461", "1245 Detroit St", "Capitol Hill", "Denver", "80203", 689000, 4, 2, 1780, "house", 1898, 0, 13, "Denver square with four bedrooms and a partially finished basement. Street parking only.", ["Four bedrooms", "Partial basement", "Original staircase"]],
  ["SR-2470", "1280 Madison St", "Congress Park", "Denver", "80206", 735000, 3, 2, 1710, "house", 1910, 0, 9, "Brick bungalow a few blocks from the park greenway. New sewer scope on file, older kitchen.", ["Sewer scope on file", "Front porch", "Detached garage"]],
  ["SR-2471", "1001 Fillmore St #3", "Congress Park", "Denver", "80206", 498000, 2, 2, 990, "condo", 1986, 275, 17, "Two-bedroom condo with a reserved carport and a balcony. The building is quiet and low-rise.", ["Carport", "Balcony", "Two baths"]],
  ["SR-2480", "2316 Glencoe St", "City Park", "Denver", "80205", 780000, 3, 2, 1840, "house", 1914, 0, 6, "Bungalow facing a tree lawn, with a finished attic bedroom and a two-car garage on the alley.", ["Attic bedroom", "Two-car garage", "Updated furnace"]],
  ["SR-2481", "2122 N Vine St", "City Park", "Denver", "80205", 649000, 3, 2, 1590, "house", 1905, 0, 20, "Narrow Denver square with three bedrooms and an unfinished basement. One bath is on the main floor.", ["Unfinished basement", "Main-floor bath", "Alley access"]],
  ["SR-2490", "655 S Grant St", "Wash Park", "Denver", "80209", 1125000, 4, 3, 2280, "house", 1926, 0, 3, "Four-square near the park with a new kitchen and a detached studio. The catalog's highest south-Denver house.", ["New kitchen", "Detached studio", "Two-car garage"]],
  ["SR-2491", "440 S Downing St #2", "Wash Park", "Denver", "80209", 695000, 2, 2, 1240, "condo", 1938, 410, 11, "Garden condo in a duplex conversion, private patio, one garage space. Two bedrooms.", ["Private patio", "Garage space", "In-unit laundry"]],
  ["SR-2500", "1250 S Pearl St", "Platt Park", "Denver", "80210", 825000, 3, 2.5, 1765, "townhome", 2012, 70, 8, "Pearl Street townhome with a roof deck and a two-car garage. Walk to the South Pearl shops.", ["Roof deck", "Two-car garage", "Primary suite"]],
  ["SR-2501", "1515 S Grant St", "Platt Park", "Denver", "80210", 749000, 3, 2, 1622, "house", 1909, 0, 14, "Bungalow with a remodeled bath and an original fireplace. Detached one-car garage.", ["Remodeled bath", "Fireplace", "One-car garage"]],
  ["SR-2510", "244 W 3rd Ave", "Baker", "Denver", "80223", 680000, 3, 2, 1510, "house", 1894, 0, 12, "Victorian cottage in Baker with a new electrical panel and a small backyard. Street parking.", ["New panel", "Backyard", "Original floors"]],
  ["SR-2511", "55 N Bannock St #410", "Baker", "Denver", "80223", 459000, 1, 1, 720, "condo", 2015, 365, 24, "One-bedroom condo with a gym in the building and one parking space. Not a three-bedroom match.", ["Building gym", "Parking space", "Balcony"]],
  ["SR-2520", "2800 E 2nd Ave #5C", "Cherry Creek", "Denver", "80206", 1450000, 3, 3, 1988, "condo", 2008, 890, 7, "Cherry Creek condo with a concierge desk, two parking spaces, and a balcony over 2nd Avenue.", ["Two parking spaces", "Concierge", "Three baths"]],
  ["SR-2530", "80 S Birch St", "Hilltop", "Denver", "80206", 1620000, 4, 3, 2640, "house", 1958, 0, 5, "Ranch on a wide lot with a renovated kitchen and a finished basement. Four bedrooms.", ["Wide lot", "Finished basement", "Renovated kitchen"]],
  ["SR-2540", "2245 Kearney St", "Park Hill", "Denver", "80207", 685000, 3, 2, 1680, "house", 1928, 0, 10, "Brick bungalow with a front porch and a one-car garage. The kitchen was replaced in 2019.", ["2019 kitchen", "Front porch", "One-car garage"]],
  ["SR-2541", "2510 Niagara St", "Park Hill", "Denver", "80207", 599000, 3, 2, 1495, "house", 1948, 0, 18, "Smaller Park Hill house with updated windows and an unfinished basement. Detached garage.", ["Updated windows", "Detached garage", "Unfinished basement"], "Sun 1:00–3:00 PM"],
  ["SR-2550", "8774 E 28th Ave", "Central Park", "Denver", "80238", 615000, 3, 2.5, 1870, "house", 2004, 45, 9, "Three-bedroom house with a two-car garage and a small yard. The former Stapleton plan name is Central Park.", ["Two-car garage", "Yard", "Main-floor bedroom"]],
  ["SR-2551", "9130 E 29th Pl", "Central Park", "Denver", "80238", 725000, 4, 3, 2340, "house", 2011, 40, 6, "Four-bedroom with a finished basement and a south-facing yard. HOA covers the front landscaping only.", ["Finished basement", "South yard", "Two-car garage"]],
  ["SR-2560", "710 19th St", "Golden", "Golden", "80401", 780000, 3, 2, 1720, "house", 1922, 0, 11, "House within walking distance of downtown Golden. Updated boiler, original porch, one-car garage.", ["Walk to downtown Golden", "Updated boiler", "Porch"]],
  ["SR-2561", "1712 Ford St", "Golden", "Golden", "80401", 649000, 3, 2, 1544, "townhome", 1996, 160, 15, "End townhome with a one-car garage and a view toward the mesa. Three bedrooms.", ["Mesa view", "One-car garage", "End unit"], "Sat 11:00 AM–1:00 PM"],
  ["SR-2570", "6412 Otis St", "Arvada", "Arvada", "80002", 525000, 3, 2, 1610, "house", 1964, 0, 13, "Ranch with a finished basement bedroom and a two-car garage. The yard backs to a greenbelt path.", ["Greenbelt", "Two-car garage", "Basement bedroom"]],
  ["SR-2571", "7420 Grandview Ave", "Arvada", "Arvada", "80002", 489000, 4, 2, 1788, "house", 1972, 0, 19, "Four-bedroom bi-level with a large family room downstairs. Useful when someone asks for four beds under $500k.", ["Four bedrooms", "Family room", "Two-car garage"]],
  ["SR-2580", "6120 W Floyd Ave", "Lakewood", "Lakewood", "80226", 535000, 3, 2, 1584, "house", 1956, 0, 8, "Brick ranch south of Belmar with a covered patio and a one-car garage. Windows replaced in 2020.", ["Covered patio", "2020 windows", "One-car garage"]],
  ["SR-2590", "4201 Vance St", "Wheat Ridge", "Wheat Ridge", "80033", 499000, 3, 2, 1490, "house", 1959, 0, 16, "Ranch with a shed and a deep backyard. The kitchen is original; the furnace is from 2018.", ["Deep backyard", "2018 furnace", "Shed"], "Sun 1:00–3:00 PM"],
];

function toListing(row: Row): Listing {
  const [id, address, neighborhood, city, zip, price, beds, baths, sqft, type, yearBuilt, hoa, daysOnMarket, description, highlights, openHouse] = row;
  return {
    id,
    address,
    neighborhood,
    city,
    state: "CO",
    zip,
    price,
    beds,
    baths,
    sqft,
    type,
    yearBuilt,
    hoa: hoa > 0 ? hoa : null,
    daysOnMarket,
    description,
    highlights: [...highlights],
    openHouse,
  };
}

export const LISTINGS: Listing[] = ROWS.map(toListing);

export function listingById(id: string | undefined): Listing | undefined {
  if (!id) return undefined;
  return LISTINGS.find((listing) => listing.id.toLowerCase() === id.toLowerCase());
}
