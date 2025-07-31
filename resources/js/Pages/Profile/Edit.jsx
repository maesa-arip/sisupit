import HeaderTitle from '@/Components/HeaderTitle';
import AppLayout from '@/Layouts/AppLayout';
import { IconUser } from '@tabler/icons-react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit(props) {
	console.log(props)
	return (
		<>
			<div className="flex flex-col w-full pb-32">
				<div className="flex flex-col items-start justify-between mb-8 gap-y-4 lg:flex-row lg:items-center">
					<HeaderTitle
						title={props.page_settings.title}
						subtitle={props.page_settings.subtitle}
						icon={IconUser}
					/>
				</div>
				<UpdateProfileInformationForm
					mustVerifyEmail={props.mustVerifyEmail}
					status={props.status}
					className="mb-8"
				/>
				<UpdatePasswordForm className="mb-8" />
				<DeleteUserForm className="mb-8" />
			</div>
		</>
	);
}
Edit.layout = (page) => <AppLayout children={page} title={'Edit Profile'} />;
