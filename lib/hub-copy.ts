// Original text for the hubs search engines keep (SEO list, Nov 27 2026). Each
// entry is unique to its page and says only what is true of the place or the
// category: no invented facts or numbers. Toronto uses Canadian spelling, New
// York US spelling. A hub without an entry shows no text block.
export type HubCopy = { heading: string; paragraphs: string[] };

const CHECKED_TO =
  'Every listing here is checked against the organizer’s own page before it goes live, and listings that have ended come off the page by themselves each day, so what you see is what is still on.';
const CHECKED_NY =
  'Every listing here is checked against the organizer’s own page before it goes live, and listings that have ended come off the page by themselves each day, so what you see is what is still on.';

export const HUB_COPY: Record<string, HubCopy> = {
  'toronto/class-workshop': {
    heading: 'Free classes and workshops in Toronto',
    paragraphs: [
      'This page collects free classes and workshops across Toronto: hands on sessions where you make, learn or practise something, from cookie decorating and craft tables to song writing circles run by community groups. Most are short, drop in friendly and aimed at beginners, and many are planned with families in mind.',
      'Workshops cluster around weekends and school holidays, and the weeks before the winter holidays bring the most seasonal making, like gingerbread and ornament tables. Community spaces, libraries and shopping centres host a good share of them.',
      'Bring patience for a short line and, for craft sessions, something to carry your work home in. Some workshops cap the number of seats, so arriving near the start time gives you the best chance of a spot.',
      CHECKED_TO,
    ],
  },
  'toronto/concert-screening': {
    heading: 'Free concerts and shows in Toronto',
    paragraphs: [
      'Here you will find free live music, performances and screenings around Toronto: jazz and rock sets in market clubhouses, carollers, outdoor fire and light shows, and the occasional film night. No ticket is needed for anything listed here; you just show up.',
      'Evenings and weekends carry most of the shows. In winter, Harbourfront Centre and STACKT Market both programme regular free sets, and holiday season adds carolling and outdoor performances across downtown.',
      'Outdoor shows by the lake run cold after dark, so dress for standing still. Indoor clubhouse sets fill up as the evening goes on, and getting there for the first set is the easiest way to find a spot near the stage.',
      CHECKED_TO,
    ],
  },
  'toronto/festival': {
    heading: 'Free festivals and community celebrations in Toronto',
    paragraphs: [
      'This page lists free festivals, fairs and community celebrations in Toronto: tree lightings, holiday fairs, neighbourhood street parties and multi day events in public squares. Entry is free for everything here, though some events also have paid extras on site.',
      'Late November and December are the busiest stretch, with opening nights at Nathan Phillips Square, holiday fairs at Sankofa Square and neighbourhood events like those in Cabbagetown. Summer brings the other big wave of street festivals.',
      'Opening nights draw the biggest crowds, so a later evening in a festival’s run is usually calmer if you want to look around. Many squares sit right on the subway, which beats looking for parking downtown.',
      CHECKED_TO,
    ],
  },
  'toronto/food-drink': {
    heading: 'Free food and drinks in Toronto',
    paragraphs: [
      'This page gathers free food and drink in Toronto: brand pop ups handing out samples, launch days with a free bowl or coffee, tastings, and seasonal drinks at holiday events. Everything listed is free to try, with no purchase needed unless a listing says otherwise.',
      'Brand pop ups tend to land on weekends and around product launches, and they often run for a set number of hours or until supplies run out. Downtown venues like STACKT Market and The Well host many of them.',
      'Go early on the first day of a pop up, since giveaways with a limited supply can end before the listed closing time. If a listing mentions an age limit for alcohol samples, bring photo ID.',
      CHECKED_TO,
    ],
  },
  'toronto/stackt-market': {
    heading: 'Free things at STACKT Market',
    paragraphs: [
      'STACKT Market is the shipping container market at 28 Bathurst Street, at the corner of Front and Bathurst. It hosts a steady run of free events: live bands in the Clubhouse, brand pop ups with samples, makers markets and seasonal community days with hot chocolate by the fire.',
      'Weekends carry most of the pop ups and markets, while live music often lands on Friday and Saturday evenings. In the holiday season the market adds carolling and themed weekends.',
      'The 511 Bathurst streetcar stops at Front Street, right by the market, and the 504 King streetcar is a short walk north. Much of the market is outdoors, so dress for the weather even when the event itself is in the Clubhouse.',
      CHECKED_TO,
    ],
  },
  'toronto/harbourfront': {
    heading: 'Free things at Harbourfront',
    paragraphs: [
      'Harbourfront runs along Queens Quay on the lake, with Harbourfront Centre at 235 Queens Quay West at its heart. The centre programmes a lot of free events: outdoor performances, winter festivals like HarbourFrost, family activities and talks.',
      'Summer weekends are packed with free outdoor programming, and winter brings fire shows, light displays and seasonal rides. Many events repeat across several days, so a missed evening usually has another date.',
      'The 509 Harbourfront and 510 Spadina streetcars run along Queens Quay from Union Station. It is noticeably colder and windier by the water than a few blocks north, so bring a warmer layer than you think you need.',
      CHECKED_TO,
    ],
  },
  'toronto/the-well': {
    heading: 'Free things at The Well',
    paragraphs: [
      'The Well is the shopping and dining complex at 486 Front Street West, near Spadina Avenue. Its Upper Ground level hosts brand pop ups through the year: tiny pubs with samples, holiday workshops with photos, and launch events with treats and keepsakes.',
      'Pop ups here usually run for a few days or weekends in a row, and the holiday season brings the busiest calendar. Weekday afternoons are often quieter than weekend evenings.',
      'The 510 Spadina streetcar stops close by, and the 504 King streetcar is a short walk north. Several pop ups have limited daily supplies, so going earlier in the day gives you the best chance at samples.',
      CHECKED_TO,
    ],
  },
  'toronto/yonge-and-st-clair': {
    heading: 'Free things at Yonge and St. Clair',
    paragraphs: [
      'Yonge and St. Clair is a midtown crossroads with offices, shops and community spaces around the intersection. Free events here tend to be neighbourhood scale: holiday drinks along a decorated lane, family cookie decorating and seasonal activities run by local groups.',
      'Most of what turns up here is seasonal, with the weeks before the winter holidays the busiest. Daytime weekend events suit families, while evening events are often short, so check the listed hours.',
      'St. Clair station on Line 1 sits right at the intersection, and the 512 St. Clair streetcar runs east and west from it. The area is compact, so it is easy to pair a listing here with a walk along Yonge.',
      CHECKED_TO,
    ],
  },
  'new-york/class-workshop': {
    heading: 'Free classes and workshops in New York',
    paragraphs: [
      'This page collects free classes and workshops across New York City: natural dye sessions, weaving and crochet, wreath making, map and compass skills and other hands on programs. Many are run by NYC Parks Urban Park Rangers at nature centers, and others by local shops and community groups.',
      'Weekends carry most of the sessions, and nature center programs follow the seasons, so winter brings wreaths and fire building while spring and summer lean toward gardens and wildlife.',
      'Nature center workshops often happen partly outdoors, so wear shoes that can handle mud and dress for the weather. Some programs have limited spots, so arriving at the listed start time helps.',
      CHECKED_NY,
    ],
  },
  'new-york/festival': {
    heading: 'Free festivals and celebrations in New York',
    paragraphs: [
      'This page lists free festivals and community celebrations across New York City: tree lightings, holiday fests, cultural celebrations with music and food samples, and neighborhood street events. Entry is free for everything here, though some have paid extras on site.',
      'Late November and December are the busiest stretch, with tree lightings in parks and plazas across all five boroughs. Summer brings the other big wave of street fairs and outdoor celebrations.',
      'Tree lightings draw the biggest crowds in the half hour before the lighting itself, so arriving early helps if you want to be close. Most of these events sit near a subway stop, which is easier than driving.',
      CHECKED_NY,
    ],
  },
  'new-york/tour': {
    heading: 'Free tours and guided walks in New York',
    paragraphs: [
      'This page lists free tours and guided walks in New York City: Urban Park Rangers leading bird walks, tree identification walks, geology hikes, history talks and visits to landmarked sites. A guide leads each one, and no ticket is needed.',
      'Most walks run on weekend mornings and early afternoons. The subject follows the season: winter is good for spotting resident birds and naming trees by their bark and buds, while spring and fall bring migration and foliage walks.',
      'Wear comfortable shoes and dress for being outside the whole time, since most walks stay on trails or park paths. Meet a few minutes early at the listed meeting point, because walks usually leave on time.',
      CHECKED_NY,
    ],
  },
  'new-york/beauty': {
    heading: 'Free beauty events in New York',
    paragraphs: [
      'This page lists free beauty events in New York City: shade matching, scent bars, flash facials, skin consultations and brand pop ups with samples. Everything here is free to try, with no purchase needed unless the listing says so.',
      'Beauty pop ups tend to run over a few days, often Friday through Sunday, and many land around product launches and the holiday shopping season. Nolita and Flatiron host a good share of them.',
      'Weekend afternoons are the busiest, so a weekday or the first hour of a pop up usually means a shorter wait for a consultation. Some brands hand out samples only while supplies last.',
      CHECKED_NY,
    ],
  },
  'new-york/harlem': {
    heading: 'Free things to do in Harlem',
    paragraphs: [
      'Harlem has a strong run of free events, many in its parks. Urban Park Rangers lead history walks and talks in Marcus Garvey Park, including at the restored Mount Morris Fire Watchtower, and tree walks in St. Nicholas Park, alongside community events through the year.',
      'Ranger programs here run mostly on weekends, and the topics change with the seasons. Summer adds outdoor concerts and festivals in the parks.',
      'The 2 and 3 trains stop at 125th Street on Lenox Avenue, a short walk from Marcus Garvey Park, and the A, B, C and D trains stop at 125th Street on St. Nicholas Avenue. Marcus Garvey Park is hilly, so wear shoes with grip for the walk up to the watchtower.',
      CHECKED_NY,
    ],
  },
  'new-york/flatiron': {
    heading: 'Free things to do in Flatiron',
    paragraphs: [
      'Flatiron centers on Madison Square Park and the blocks around Fifth Avenue and Broadway in the 20s. Free events here include holiday fests in the park, brand pop ups with giveaways, and markets with makers and flash treatments.',
      'The park programs events through the year, and the holiday season brings tree lightings and festive markets. Brand pop ups in the area usually run for a weekend or a few days in a row.',
      'The R and W trains stop at 23rd Street on Broadway and the 6 train stops at 23rd Street on Park Avenue South, both close to the park. Park events can get crowded right after work, so earlier in the evening is calmer.',
      CHECKED_NY,
    ],
  },
  'new-york/hudson-yards': {
    heading: 'Free things to do at Hudson Yards',
    paragraphs: [
      'Hudson Yards is the development on the far west side of Manhattan, around 20 Hudson Yards and its Public Square and Gardens. It hosts brand pop ups through the year, with free drinks, take home treats, family activities and photo moments.',
      'Pop ups here usually run over a weekend or a short stretch of days, and the holiday season brings the busiest calendar, with themed installations and seasonal treats.',
      'The 7 train ends at 34th Street Hudson Yards, right next to the plaza. The High Line also starts here, so a listing at Hudson Yards pairs well with a walk south along it.',
      CHECKED_NY,
    ],
  },
  'new-york/van-cortlandt-park': {
    heading: 'Free things to do in Van Cortlandt Park',
    paragraphs: [
      'Van Cortlandt Park is one of the largest parks in the Bronx, with woods, trails and the Van Cortlandt Nature Center near West 246th Street and Broadway. The nature center runs free programs such as wreath making, owl pellet discovery and seasonal nature activities.',
      'Programs run mostly on weekends, and the topics follow the seasons, with crafts and wildlife sessions in winter and more trail based programs in warmer months.',
      'The 1 train ends at Van Cortlandt Park 242nd Street, a short walk from the nature center. Trails can be muddy after rain or snow, so wear boots or shoes you do not mind getting dirty.',
      CHECKED_NY,
    ],
  },
};

export function hubCopy(city: string, hub: string): HubCopy | null {
  return HUB_COPY[`${city}/${hub}`] ?? null;
}
