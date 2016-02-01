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
GetOptions(
    "help" => \$help,
    "verbose" => \$VERBOSE,
    "dry-run" => \$DRY_RUN,
    "credit=s" => \$credit,
    "title=s" => \$title,
    "collection=s" => \$collection,
    "slug=s" => \$slug,
    );
my $json_file = shift;

my $Usage = <<"USAGE";
$0 [--help]
$0 [--verbose] [--dry-run] [--credit=STR] [--title=STR] --collection=STR [--slug=STR] JSON_FILE
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

my $json = join('', IO::File->new($json_file)->getlines());
my $fb_data = decode_json($json);

my $slides_file = "$image_dir/slides.storable";
my $slides = { slides => [] };
if(defined($title)) {
    $slides->{title} = $title;
} else {
    $slides->{title} = $fb_data->{aName};
}

defined($credit) or $credit = $fb_data->{aAuth};

my $i=0;
foreach my $photo (@{$fb_data->{photos}}) {
    my $fb_url = $photo->{href};
    my $image_url = $photo->{url};
    my $target_filename = "$slug-".sprintf("%04i", ++$i).".jpg";    
    my $orig_file = "$orig_dir/$target_filename";
    my $thumb_file = "$thumb_dir/tn_$target_filename";
    my $image_file = "$image_dir/$target_filename";
    my $slide = {
	active => 1,
	image => $image_file,
	thumb => $thumb_file,
	orig => $orig_file,
	fb_url => $fb_url,
	title => "Credit: $credit",
    };
    push(@{$slides->{slides}}, $slide);

    cmd("curl -o '$orig_file' '$image_url'");
    cmd("convert -geometry '1500x1500>' '$orig_file' '$image_file'");
    cmd("convert -geometry 200x200^ -gravity Center -crop 200x150+0+0 +repage '$orig_file' '$thumb_file'");
}
$DRY_RUN or lock_store($slides => $slides_file);

sub dir {
    my $dir = shift;
    print "mkdir($dir)\n" if $VERBOSE;
    return if $DRY_RUN;
    -d $dir or mkdir($dir) or die("mkdir($dir): $!");
}

sub cmd {
    my $cmd = shift;
    print "$cmd\n" if $VERBOSE;
    $DRY_RUN or system($cmd);
}

__END__



