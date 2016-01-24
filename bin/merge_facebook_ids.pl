#!/usr/bin/perl

use strict;
use warnings;

use FindBin qw($RealBin);

use JSON qw(decode_json encode_json);
use Storable qw(lock_store lock_retrieve);
use Data::Dumper qw(Dumper);
use IO::File;
use File::Basename qw(basename dirname);
use File::Copy qw(copy);

use Getopt::Long qw(GetOptions);
my $help = 0;
my $VERBOSE = 0;
my $DRY_RUN = 0;
my $collection;
GetOptions(
    "help" => \$help,
    "verbose" => \$VERBOSE,
    "dry_run" => \$DRY_RUN,
    "collection=s" => $collection,
    );
my $filename = shift;

my $Usage = <<"USAGE";
$0 [--help]
$0 [--verbose] [--dry-run] --collection=NAME FILENAME
USAGE
    ;

$help and die $Usage;
defined($collection) or die "--collection is required.\n$Usage";
(defined($filename) && -f $filename) or die $Usage; 

my @fb_ids; 
@fb_ids = map {chomp; $_;} IO::File->new($filename)->getlines();

my $image_dir = "$RealBin/../images/$collection";
-d $image_dir or die "$image_dir not found.";

my $slides_file = "$image_dir/slides.storable";
my $slides = lock_retrieve($slides_file);
foreach my $slide (@{$slides->{slides}}) {
    my $id = shift @fb_ids;
    $slide->{fburl} = "https://www.facebook.com/gophocollective/photos/a.10153327080078691.1073741848.51987868690/$id/?type=3&theater";
}

unless($DRY_RUN) {
    lock_store($slides => $slides_file);
}
print Dumper($slides);
__END__



