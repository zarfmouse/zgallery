#!/usr/bin/perl

use strict;
use warnings;

use Storable qw(lock_store lock_retrieve);
use Data::Dumper qw(Dumper);
use File::Temp;

my $fh = File::Temp->new(SUFFIX=>'.pl');
my $filename = $fh->filename();

my $datafile = shift;

print $fh Dumper(lock_retrieve($datafile));
system("emacs $filename");
my $data = do $filename;
lock_store($data, $datafile);
print Dumper($data);

__END__

#!/usr/bin/perl

use strict;
use warnings;

use Storable qw(lock_retrieve lock_store);
use Data::Dumper qw(Dumper);

my $data = lock_retrieve("slides.storable");

my $prev_pass_id = undef;
my $i=1;
foreach my $slide (@{$data->{slides}}) {
    if($i++ >= 555) {
	my $pass_id = $slide->{pass_id};
	$slide->{pass_id} = $prev_pass_id;
	$prev_pass_id = $pass_id;
    }
}
print Dumper($data);
