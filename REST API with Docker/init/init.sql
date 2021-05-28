USE yelpdb;
DROP TABLE IF EXISTS businesses;

CREATE TABLE businesses
(
  id MEDIUMINT NOT NULL AUTO_INCREMENT,
  ownerid MEDIUMINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  zip VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  subcategory VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  email VARCHAR(255),
  PRIMARY KEY (id),
  KEY idx_ownerid (ownerid)
);

INSERT INTO businesses SET
	id=1,
	ownerid=7,
	name='Block 15',
	address='300 SW Jefferson Ave.',
	city='Corvallis',
	state='OR',
	zip='97333',
	phone='541-758-2077',
	category='Restaurant',
	subcategory='Brewpub',
	website='http://block15.com';

INSERT INTO businesses SET
    ownerid= 1,
    name='Corvallis Brewing Supply',
    address='119 SW 4th St.',
    city='Corvallis',
    state='OR',
    zip= '97333',
    phone='541-758-1674',
    category='Shopping',
    subcategory='Brewing Supply',
    website='http://www.lickspigot.com';
INSERT INTO businesses SET
    ownerid= 2,
    name='Fun land',
    address='119 SW 420th St.',
    city='Magicland',
    state='OR',
    zip= '96543',
    phone='541-758-1674',
    category='Entertainment',
    subcategory='Amusement Park',
    website='http://www.fakesite.com';
INSERT INTO businesses SET
    ownerid= 3,
    name='First Alternative Co-op North Store',
    address='2855 NW Grant Ave.',
    city='Corvallis',
    state='OR',
    zip= '97333',
    phone='541-758-1674',
    category='Shopping',
    subcategory='Brewing Supply';
INSERT INTO businesses SET
    ownerid= 4,
    name='WinCo Foods',
    address='2335 NW Kings Blvd.',
    city='Corvallis',
    state='OR',
    zip= '97333',
    phone='541-758-1674',
    category='Shopping',
    subcategory='Groceries';
INSERT INTO businesses SET
    ownerid= 4,
    name='WinCo Foods',
    address='2335 NW Kings Blvd.',
    city='Corvallis',
    state='OR',
    zip= '97333',
    phone='541-758-1674',
    category='Shopping',
    subcategory='Groceries';

INSERT INTO businesses SET
    ownerid= 5,
    name='TEST',
    address='2335 NW Kings Blvd.',
    city='Corvallis',
    state='OR',
    zip= '97333',
    phone='541-758-1674',
    category='Shopping',
    subcategory='Groceries';
INSERT INTO businesses SET
    ownerid= 6,
    name='TEST2',
    address='2335 NW Kings Blvd.',
    city='Corvallis',
    state='OR',
    zip= '97333',
    phone='541-758-1674',
    category='Shopping',
    subcategory='Groceries';
INSERT INTO businesses SET
    ownerid= 7,
    name='TEST3',
    address='2335 NW Kings Blvd.',
    city='Corvallis',
    state='OR',
    zip= '97333',
    phone='541-758-1674',
    category='Shopping',
    subcategory='Groceries';
INSERT INTO businesses SET
    ownerid= 8,
    name='TEST4',
    address='2335 NW Kings Blvd.',
    city='Corvallis',
    state='OR',
    zip= '97333',
    phone='541-758-1674',
    category='Shopping',
    subcategory='Groceries';

DROP TABLE IF EXISTS photos;

CREATE TABLE photos
(
  id MEDIUMINT NOT NULL AUTO_INCREMENT,
  userID MEDIUMINT NOT NULL,
  businessID int(11) NOT NULL,
  caption VARCHAR(255),
  PRIMARY KEY (id),
  KEY idx_userid (userid),
  KEY idx_businessid (businessid)
);

INSERT INTO photos SET
	userid=7,
	businessid=1,
	caption='Hops';
INSERT INTO photos SET
	userid=1,
	businessid=2,
	caption='FSAs';
INSERT INTO photos SET
	userid=2,
	businessid=3,
	caption='ASFS';
INSERT INTO photos SET
	userid=3,
	businessid=4,
	caption='HTESTSDFDSA';
INSERT INTO photos SET
	userid=4,
	businessid=5,
	caption='Test2';
INSERT INTO photos SET
	userid=5,
	businessid=6,
	caption='Test';

DROP TABLE IF EXISTS reviews;

CREATE TABLE reviews (
  id MEDIUMINT NOT NULL AUTO_INCREMENT,
  userid MEDIUMINT NOT NULL,
  businessID MEDIUMINT NOT NULL,
  dollars MEDIUMINT NOT NULL,
  stars MEDIUMINT NOT NULL,
  review VARCHAR(255),
  PRIMARY KEY (id),
  KEY idx_userid (userid),
  KEY idx_businessid (businessid)
);

INSERT INTO reviews SET
	userid=1,
	businessid=1,
	dollars=2,
	stars=5,
	review='Super good';
INSERT INTO reviews SET
	userid=2,
	businessid=2,
	dollars=2,
	stars=5,
	review='A Corvallis gem.';
INSERT INTO reviews SET
	userid=3,
	businessid=3,
	dollars=2,
	stars=5,
	review='Joel, the owner, is super friendly and helpful.';
INSERT INTO reviews SET
	userid=4,
	businessid=4,
	dollars=2,
	stars=5,
	review='How many fasteners can one room hold?';

INSERT INTO reviews SET
	userid=5,
	businessid=5,
	dollars=1,
	stars=5,
	review='How';