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
my $pass;
my $credit;
my $title;
my $skip_mogrify = 0;
GetOptions(
    "help" => \$help,
    "verbose" => \$VERBOSE,
    "pass=s" => \$pass,
    "credit=s" => \$credit,
    "title=s" => \$title,
    "skip-mogrify" => $skip_mogrify,
    );

my $Usage = <<"USAGE";
$0 [--help]
$0 [--verbose] [--pass=FILENAME];
USAGE
    ;

$help and die $Usage;

my @pass_ids;
if(defined($pass)) {
    -f $pass or die "$pass not found";
    @pass_ids = map {chomp; $_;} IO::File->new($pass)->getlines();
}

my $image_dir = "$RealBin/../images";
-d $image_dir or die "$image_dir not found.";
my $thumb_dir = "$image_dir/thumbs";
-d $thumb_dir or mkdir($thumb_dir, 0755) or die "mkdir($thumb_dir): $!";

my $slides_file = "$image_dir/slides.storable";
my $slides = { slides => [] };
if(defined($title)) {
    $slides->{title} = $title;
}

foreach my $image (glob("$image_dir/*.jpg")) {
    my $filename = basename($image);
    my $dirname = dirname($image);
    print "$image...\n";

    my $thumb_file = "$thumb_dir/tn_$filename";
    unless($skip_mogrify) {
	copy($image, $thumb_file) or die "copy($image, $thumb_file): $!";
	my $cmd = "mogrify -geometry 200x200^ -gravity Center -crop 200x150+0+0 +repage '$thumb_file'";
	print "\t$cmd\n" if $VERBOSE;
	system($cmd);
    } else {
	-f $thumb_file or die "$thumb_file is missing";
    }
    my $slide = {
	image => "images/$filename",
	thumb => "images/thumbs/tn_$filename",
	active => 1,
    };
    push(@{$slides->{slides}}, $slide);
    if(defined($pass)) {
	$slide->{pass_id} = shift @pass_ids;
	print "\t$slide->{pass_id}\n" if $VERBOSE;
    }
    if(defined($credit)) {
	$slide->{title} = "Credit: $credit";
    }
}
lock_store($slides => $slides_file);
print Dumper($slides);
__END__



