/* American SMB — homepage sample content (rough, November 2026). Replace with CMS data later. */
(function () {
  var SEC = {
    funding: ['Funding & Grants', '#B45309'], money: ['Money & Taxes', '#0F7B6C'], people: ['Hiring & Benefits', '#C8102E'],
    marketing: ['Marketing & Sales', '#8A3FB8'], tech: ['AI & Tech', '#4338CA'], growth: ['Start & Grow', '#1E4FA8'], policy: ['Trade & Policy', '#0B2552']
  };
  function img(id, w) { return 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&q=80&w=' + (w || 900); }
  var n = 0;
  function post(section, type, title, excerpt, date, mins, photo) {
    n += 1;
    var d = new Date(date + 'T10:00:00');
    return {
      id: 'p' + n, slug: 'post-' + n, type: type, title: title, excerpt: excerpt,
      date: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      shortDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), at: d.getTime(),
      mins: mins, img: img(photo, 900), imgLarge: img(photo, 1600), thumb: img(photo, 400), alt: title,
      section: section, sectionLabel: SEC[section][0], color: SEC[section][1], category: SEC[section][0],
      author: 'American SMB Editorial', href: '#'
    };
  }

  var cover = post('marketing', 'guide', 'Small Business Saturday is Nov. 28: a 7-day plan for Main Street’s biggest day',
    'One in five holiday shoppers say they plan to buy from small or local businesses this year. Here is how to get found, stock smart and turn one-day visitors into regulars.',
    '2026-11-20', 7, 'photo-1759630752910-5487316a5194');
  var sec1 = post('people', 'explainer', 'Health premiums could rise 14% in 2027: how small employers can prepare for renewal',
    'Why small-group rates are climbing and the options worth a look before you sign.', '2026-11-19', 6, 'photo-1532938911079-1b06ac7ceec7');
  var sec2 = post('funding', 'news', 'SBA closes 2026 with $100 billion in capital and a $10 million loan ceiling',
    'What the record year and the higher 7(a) plus 504 limit mean for growing businesses.', '2026-11-18', 4, 'photo-1683283106454-8b1b22ebf9e5');

  window.AMSMB_COVER = { post: cover, secondary: [sec1, sec2], kicker: 'Cover story · Marketing & Sales' };

  window.AMSMB_POSTS = [
    post('marketing', 'news', 'One in five holiday shoppers plan to buy local this year, retail survey finds', 'Small retailers are leaning on email, social and local events to reach them before the big weekend.', '2026-11-20', 3, 'photo-1513884923967-4b182ef167ab'),
    post('money', 'guide', 'Year-end tax moves for 2026: bonus depreciation, Section 179 and the Dec. 31 deadline', '100% bonus depreciation is back for good. The five moves to talk through with your accountant before the year closes.', '2026-11-20', 6, 'photo-1554224155-a1487473ffd9'),
    post('growth', 'news', 'Small-business optimism holds at 97.8 as price-hike plans hit a 2022 high', 'Sales improved in October and uncertainty eased, but more owners plan to raise prices and labor quality is still the top problem.', '2026-11-12', 3, 'photo-1648877794940-4a24e7fb87f8'),
    post('funding', 'news', 'Veterans Small Business Week: where veteran owners can find capital and contracts', 'Loans, mentoring and federal contracting programmes for America’s 1.8 million veteran-owned businesses.', '2026-11-13', 4, 'photo-1749102166798-5ba7f3907279'),
    post('people', 'guide', 'Can’t find good workers? One in four owners now call it their top problem', 'Labor quality is back at the top of the list. What the businesses that hire well are doing differently.', '2026-11-11', 6, 'photo-1686771416282-3888ddaf249b'),
    post('policy', 'explainer', 'Tariffs after the Supreme Court ruling: what changed for small importers, and what didn’t', 'The emergency tariffs were struck down in February and new ones took their place. Section 232 and 301 duties still apply.', '2026-11-16', 7, 'photo-1605732562742-3023a888e56e'),
    post('tech', 'guide', 'Where to start with AI: five jobs small businesses hand over first', 'About half of owners plan to use more AI this year, mostly for marketing content. A practical starting list.', '2026-11-15', 5, 'photo-1525547719571-a2d4ac8945e2'),
    post('funding', 'guide', 'SBA 7(a) or 504? Choosing the right loan now that the limit is $10 million', 'Rates, uses, down payments and timelines compared, with the questions lenders will ask.', '2026-11-14', 7, 'photo-1450101499163-c8848c66ca85'),
    post('policy', 'news', 'SBA proposes new size standards that would make 110,000 more firms “small”', 'The proposal would change who qualifies for SBA loans and set-aside contracts. How to check your industry.', '2026-11-09', 4, 'photo-1520525003249-2b9cdda513bc'),
    post('policy', 'guide', 'Selling across state lines? A plain guide to sales tax nexus', 'When an out-of-state sale means you owe tax there, and the thresholds most states use.', '2026-11-08', 6, 'photo-1556742031-c6961e8560b0'),
    post('policy', 'explainer', 'Section 232 and 301 tariffs: which ones still apply to the goods you import', 'Steel, aluminum and China-origin goods still carry duties. How to check your product codes.', '2026-11-07', 6, 'photo-1578575437130-527eed3abbec'),
    post('policy', 'guide', 'W-2 or 1099? The tests regulators use to classify workers', 'Getting it wrong is expensive. The questions that decide whether someone is an employee.', '2026-11-06', 5, 'photo-1763729805496-b5dbf7f00c79'),
    post('growth', 'guide', 'Selling to the government: a first-timer’s guide to federal contracts', 'Registration, set-asides and how small firms win their first federal job.', '2026-11-13', 7, 'photo-1542744173-8e7e53415bb0'),
    post('growth', 'guide', 'Buying an existing business: the due-diligence checklist', 'The documents to ask for and the red flags to look for before you sign.', '2026-11-10', 6, 'photo-1531346878377-a5be20888e57'),
    post('growth', 'interview', 'Made in USA: how small manufacturers are winning reshored orders', 'Owners on what changed when big customers started buying closer to home.', '2026-11-08', 5, 'photo-1647427060118-4911c9821b82'),
    post('money', 'guide', 'Raising prices without losing customers: a playbook for 2027', 'How to time it, explain it and protect your best customers.', '2026-11-17', 5, 'photo-1571907483086-3c0ea40cc16d'),
    post('money', 'guide', 'A 13-week cash flow forecast you can build in one afternoon', 'The simplest tool for spotting a cash crunch before it arrives.', '2026-11-12', 5, 'photo-1529078155058-5d716f45d604'),
    post('money', 'guide', 'Business credit 101: how to build a score lenders trust', 'Why your business credit file matters and the steps that move it.', '2026-11-09', 4, 'photo-1526304640581-d334cdbbf45e'),
    post('marketing', 'guide', 'Google Business Profile: the free tool that wins “near me” searches', 'The single highest-return hour most local businesses can spend this month.', '2026-11-18', 5, 'photo-1604357209793-fca5dca89f97'),
    post('marketing', 'guide', 'Email marketing for Main Street: a simple monthly plan', 'Four emails a month, what to put in them and how to grow the list.', '2026-11-11', 4, 'photo-1596526131083-e8c633c948d2'),
    post('marketing', 'guide', 'How to get your business recommended by AI search assistants', 'What ChatGPT-style search looks at, and how to make your business easy to recommend.', '2026-11-07', 5, 'photo-1460925895917-afdab827c52f'),
    post('people', 'explainer', 'ICHRA and QSEHRA explained: alternatives to a group health plan', 'How these reimbursement plans work and when they cost less than a group policy.', '2026-11-16', 6, 'photo-1600880292203-757bb62b4baf'),
    post('people', 'guide', 'Hiring your first employee: the paperwork checklist', 'EIN, I-9, W-4, state registration and workers’ comp, in the right order.', '2026-11-09', 5, 'photo-1758691737278-3af15b37af48'),
    post('tech', 'guide', 'Cybersecurity basics every 10-person business needs', 'You are not too small to be targeted. The low-cost steps that stop most attacks.', '2026-11-14', 5, 'photo-1550751827-4bd374c3f58b'),
    post('tech', 'guide', 'Choosing a POS system: what small retailers should compare', 'Fees, inventory, payments and the features that matter at checkout.', '2026-11-10', 5, 'photo-1519520104014-df63821cb6f9'),
    post('funding', 'guide', 'Small business grants that really exist: a no-hype guide', 'Most federal money is loans, not grants. Where the real grants are and who can apply.', '2026-11-17', 7, 'photo-1753351052363-53ce102830eb'),
    post('funding', 'explainer', 'SCALE and E2G: what the SBA’s new manufacturing grants mean for small makers', 'The money goes to organisations that help small manufacturers. How to benefit.', '2026-11-15', 5, 'photo-1610891015188-5369212db097'),
    post('marketing', 'guide', 'Turning one-day holiday shoppers into regulars', 'Loyalty, follow-up emails and January offers that bring people back.', '2026-11-19', 4, 'photo-1687422808191-93810cd07ab0'),
    post('money', 'explainer', 'LLC or S-corp: which saves you more in taxes?', 'How each is taxed, when switching makes sense and what it costs to run.', '2026-11-13', 6, 'photo-1598432439250-0330f9130e14'),
    post('growth', 'guide', 'Shipping costs climbing? How small sellers are cutting freight bills', 'Carrier contracts, packaging and fulfilment options compared.', '2026-11-06', 5, 'photo-1553413077-190dd305871c')
  ];
})();
