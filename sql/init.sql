create table staff(
    -- auto increment
    id integer primary key,
    name text not null,
    uuid text not null
);

create table author(
    -- auto increment
    id integer primary key,
    name text not null
);

create table publisher(
    -- auto increment
    id integer primary key,
    name text not null
);

create table category(
    -- auto increment
    id integer primary key,
    name text not null
);

create table book(
    -- auto increment
    id integer primary key,
    price integer not null,
    title text not null,
    release text not null,
    staff_id integer not null,
    author_id integer not null,
    publisher_id integer not null,
    category_id integer not null,
    foreign key(staff_id) references staff(id),
    foreign key(author_id) references author(id),
    foreign key(publisher_id) references publisher(id),
    foreign key(category_id) references category(id)
);