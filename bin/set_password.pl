#!/usr/bin/perl

use strict;
use warnings;

use FindBin qw($RealBin);
use Term::ReadKey;
use Digest::SHA1 qw(sha1_hex);;
use Storable qw(lock_store);

$| = 1;

print "Type your password:";
ReadMode('noecho'); 
chomp(my $password = <STDIN>);
ReadMode(0);
print "\n";

my @set = ('0' ..'9', 'a' .. 'f');
my $salt = join('',  map $set[rand @set], 1 .. 32);

my $password_data = {
    salt => $salt,
    hash => sha1_hex($salt, $password),
};

lock_store $password_data => "$RealBin/../.admin_password";



