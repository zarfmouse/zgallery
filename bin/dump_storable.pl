#!/usr/bin/perl

use strict;
use warnings;

use Storable qw(lock_retrieve);
use Data::Dumper qw(Dumper);

my $datafile = shift;

print Dumper(lock_retrieve($datafile));
