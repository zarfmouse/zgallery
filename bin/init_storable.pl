#!/usr/bin/perl

use strict;
use warnings;

use Storable qw(lock_store lock_retrieve);
use Data::Dumper qw(Dumper);
use File::Temp;

my $datafile = shift;
my $data = {};
lock_store($data, $datafile);
print Dumper($data);
