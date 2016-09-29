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
my $credit;
my $title;
my $collection;
my $slug;
my $no_slug = 0;
my $update = 0;
my $force = 0;
GetOptions(
    "help" => \$help,
    "verbose" => \$VERBOSE,
    "dry-run" => \$DRY_RUN,
    "credit=s" => \$credit,
    "title=s" => \$title,
    "collection=s" => \$collection,
    "slug=s" => \$slug,
    "no-slug" => \$no_slug,
    "update" => \$update,
    "force" => \$force,
    );

my $Usage = <<"USAGE";
$0 [--help]
$0 [--verbose] [--dry-run] [--credit=STR] [--title=STR] --collection=STR [--slug=STR | --no-slug] [--update]
USAGE
    ;

$help and die $Usage;
defined($collection) or die "--collection is required.\n$Usage";
defined($slug) or $slug = $collection;

chdir("$RealBin/..") or die "chdir($RealBin/..): $!";
my $image_dir = "images/$collection";
dir($image_dir);
my $orig_dir = "$image_dir/orig";
dir($orig_dir);
my $thumb_dir = "$image_dir/thumbs";
dir($thumb_dir);

my $slides_file = "$image_dir/slides.storable";
my $slides = { slides => [] };
if(-f $slides_file) {
    if($update) {
	$slides = lock_retrieve($slides_file);
    } else {
	die "$slides_file already exists!\n";
    }
}

if(defined($title)) {
    $slides->{title} = $title;
}

my $i=0;

foreach my $orig_file (glob("$orig_dir/*")) {
    chmod(0644, $orig_file);
    my $target_filename = $no_slug ? basename($orig_file) : "$slug-".sprintf("%04i", ++$i).".jpg";
    my $thumb_file = "$thumb_dir/tn_$target_filename";
    my $image_file = "$image_dir/$target_filename";
    my $slide;
    if($update) {
	foreach my $existing_slide (@{$slides->{slides}}) {
	    if($existing_slide->{orig} eq $orig_file) {
		$slide = $existing_slide;
	    }
	}
    }
    unless(defined($slide)) {
	$slide = {
	    active => 1,
	    image => $image_file,
	    thumb => $thumb_file,
	    orig => $orig_file,
	    title => "Credit: $credit",
	};
	push(@{$slides->{slides}}, $slide);
    }

    if($force or not -f $image_file) {
	cmd("convert -geometry '1500x1500>' '$orig_file' '$image_file'");
    }
    chmod(0644, $image_file) or die("chmod($image_file): $!");

    if($force or not -f $thumb_file) {
	cmd("convert -geometry 200x200^ -gravity Center -crop 200x150+0+0 +repage '$orig_file' '$thumb_file'");
    }
    chmod(0644, $thumb_file) or die("chmod($thumb_file): $!");
}
$DRY_RUN or lock_store($slides => $slides_file);

sub dir {
    my $dir = shift;
    print "mkdir($dir)\n" if $VERBOSE;
    return if $DRY_RUN;
    -d $dir or mkdir($dir) or die("mkdir($dir): $!");
    chmod(0755, $dir) or die("chmod($dir): $!");
}

sub cmd {
    my $cmd = shift;
    print "$cmd\n" if $VERBOSE;
    $DRY_RUN or system($cmd);
}

__END__



